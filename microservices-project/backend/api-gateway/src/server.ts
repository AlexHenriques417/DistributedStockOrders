import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import dotenv from 'dotenv';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import promBundle from 'express-prom-bundle';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client for rate limiting
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Prometheus metrics
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  promClient: {
    collectDefaultMetrics: {},
  },
});
app.use(metricsMiddleware);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
  credentials: true,
}));
app.use(hpp());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as any,
  }),
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-gateway',
  });
});

// API routes (direct routing with auth)
app.use('/api/auth', routes.authRoutes);
app.use('/api/users', authMiddleware, routes.userRoutes);

// Service proxies
const serviceProxies: Record<string, string> = {
  '/api/users': process.env.USER_SERVICE_URL || 'http://localhost:3001',
  '/api/catalog': process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  '/api/inventory': process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003',
  '/api/orders': process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  '/api/payments': process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
};

Object.entries(serviceProxies).forEach(([path, target]) => {
  app.use(path, authMiddleware, proxy(target, {
    proxyReqPathResolver: (req) => {
      return `/api${req.url}`;
    },
    proxyErrorHandler: (err, res, next) => {
      console.error('Proxy error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Service unavailable',
      });
    },
  }));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
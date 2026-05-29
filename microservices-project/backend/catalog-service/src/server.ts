import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import amqp, { Channel } from 'amqplib';

import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRabbitMQ } from './config/rabbitmq';

// ✅ IMPORTAÇÃO CORRETA (singleton)
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Redis
export const redis = new Redis(
  process.env.REDIS_URL || 'redis://:redis_pass_123@localhost:6379'
);

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

let channel: Channel;

// 🚀 START SERVER
const startServer = async () => {
  try {
    // RabbitMQ connection
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL ||
        'amqp://admin:rabbitmq_pass_123@localhost:5672'
    );

    channel = await connection.createChannel();
    await setupRabbitMQ(channel);

    console.log('Connected to RabbitMQ');

    app.set('rabbitmqChannel', channel);

    // Middlewares
    app.use(helmet());
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      })
    );

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(morgan('combined'));
    app.use(requestLogger);

    // Health check
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'catalog-service',
        database: 'connected',
        redis: redis.status,
        rabbitmq: channel ? 'connected' : 'disconnected',
      });
    });

    // Metrics
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send('# Metrics available through prom-client');
    });

    // Routes
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Catalog Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received: shutting down...');
  await prisma.$disconnect();
  redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received: shutting down...');
  await prisma.$disconnect();
  redis.quit();
  process.exit(0);
});

startServer();

export default app;
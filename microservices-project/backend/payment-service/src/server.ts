import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import connect from 'amqplib';

import paymentRoutes from './routes/paymentRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRabbitMQ, consumeOrderEvents } from './config/rabbitmq';
import paymentService from './services/paymentService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

export const prisma = new PrismaClient();
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

let channel: connect.Channel | null = null;

const startServer = async () => {
  try {
    // Connect to RabbitMQ
    const connection = await connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    channel = await connection.createChannel();
    await setupRabbitMQ(channel);
    console.log('Connected to RabbitMQ');
    app.set('rabbitmqChannel', channel);

    // Start consuming order events
    await consumeOrderEvents(channel, async (message, routingKey) => {
      console.log(`Processing order event: ${routingKey}`);
      try {
        if (routingKey === 'order.created') {
          await paymentService.handleOrderCreated(message, channel);
        } else if (routingKey === 'order.confirmed') {
          await paymentService.handleOrderConfirmed(message, channel);
        }
      } catch (error) {
        console.error('Error handling order event:', error);
      }
    });

    // Security middleware
    app.use(helmet());
    app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Logging
    app.use(morgan('combined'));
    app.use(requestLogger);

    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'payment-service',
        database: 'connected',
        redis: redis.status,
        rabbitmq: channel ? 'connected' : 'disconnected',
      });
    });

    // Metrics endpoint for Prometheus
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', 'text/plain');
      // Prometheus metrics would be handled by express-prom-bundle
      res.send('# Metrics available through prom-client');
    });

    // API Routes
    app.use('/api/payments', paymentRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  redis.quit();
  process.exit(0);
});

startServer();

export default app;

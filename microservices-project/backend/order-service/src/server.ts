import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import amqp, { Channel } from 'amqplib';

import orderRoutes from './routes/orderRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRabbitMQ, consumeEvents } from './config/rabbitmq';
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

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

// RabbitMQ Channel
let channel: Channel;

const startServer = async () => {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq_pass_123@localhost:5672'
    );
    
    channel = await connection.createChannel();
    await setupRabbitMQ(channel);
    console.log('Connected to RabbitMQ');
    
    app.set('rabbitmqChannel', channel);
    
    // Store channel globally for saga orchestrator
    (global as any).rabbitmqChannel = channel;

    // Start consuming events from other services
    await consumeEvents(channel);

    // Security middleware
    app.use(helmet());
    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      })
    );

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Logging
    app.use(morgan('combined'));
    app.use(requestLogger);

    // Health check
    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'order-service',
        database: 'connected',
        redis: redis.status,
        rabbitmq: channel ? 'connected' : 'disconnected',
      });
    });

    // Metrics endpoint for Prometheus
    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send('# Metrics available through prom-client');
    });

    // API Routes
    app.use('/api/orders', orderRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
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

export { prisma, channel };
export default app;
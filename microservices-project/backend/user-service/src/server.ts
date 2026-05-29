import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import amqp, { Channel } from 'amqplib';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { setupRabbitMQ } from './config/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

export const prisma = new PrismaClient();

/*
=====================================================
REDIS
=====================================================
*/
export const redis = new Redis(
  process.env.REDIS_URL || 'redis://:redis_pass_123@localhost:6379'
);

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

/*
=====================================================
RABBITMQ
=====================================================
*/
let channel: Channel;

const startServer = async () => {
  try {
    // RabbitMQ connection
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://admin:rabbitmq_pass_123@localhost:5672'
    );

    channel = await connection.createChannel();

    await setupRabbitMQ(channel);

    console.log('Connected to RabbitMQ');

    app.set('rabbitmqChannel', channel);

    /*
    =====================================================
    MIDDLEWARES
    =====================================================
    */

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

    /*
    =====================================================
    ROUTES
    =====================================================
    */

    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'user-service',
        database: 'connected',
        redis: redis.status,
        rabbitmq: channel ? 'connected' : 'disconnected',
      });
    });

    app.get('/metrics', async (_req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send('# Metrics available through prom-client');
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);

    /*
    =====================================================
    ERROR HANDLERS
    =====================================================
    */

    app.use(notFoundHandler);
    app.use(errorHandler);

    /*
    =====================================================
    SERVER
    =====================================================
    */

    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

/*
=====================================================
GRACEFUL SHUTDOWN
=====================================================
*/

process.on('SIGTERM', async () => {
  console.log('SIGTERM received');

  await prisma.$disconnect();

  redis.quit();

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received');

  await prisma.$disconnect();

  redis.quit();

  process.exit(0);
});

startServer();

export default app;
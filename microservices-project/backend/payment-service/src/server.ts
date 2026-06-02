import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import amqp, { Channel } from 'amqplib';

import paymentRoutes from './routes/paymentRoutes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler';

import { requestLogger } from './middleware/requestLogger';

import {
  setupRabbitMQ,
  consumeOrderEvents,
} from './config/rabbitmq';

import paymentService from './services/paymentService';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3005;

export const prisma = new PrismaClient();

/*
=====================================================
REDIS
=====================================================
*/
export const redis =
  process.env.NODE_ENV === 'test'
    ? ({
        on: () => {},
        quit: async () => {},
        status: 'mock',
      } as any)
    : new Redis(
        process.env.REDIS_URL ||
          'redis://:redis_pass_123@localhost:6379'
      );

if (process.env.NODE_ENV !== 'test') {
  redis.on('connect', () => {
    console.log('Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('Redis Error:', err);
  });
}

/*
=====================================================
RABBITMQ
=====================================================
*/
let channel: Channel;

export const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      const connection = await amqp.connect(
        process.env.RABBITMQ_URL ||
          'amqp://admin:rabbitmq_pass_123@localhost:5672'
      );

      channel = await connection.createChannel();

      await setupRabbitMQ(channel);

      console.log('Connected to RabbitMQ');

      app.set('rabbitmqChannel', channel);

      await consumeOrderEvents(
        channel,
        async (
          message: any,
          routingKey: string
        ) => {
          console.log(
            `Processing order event: ${routingKey}`
          );

          try {
            if (
              routingKey ===
              'order.created'
            ) {
              await paymentService.handleOrderCreated(
                message
              );
            }

            if (
              routingKey ===
              'order.confirmed'
            ) {
              await paymentService.handleOrderConfirmed(
                message,
                channel
              );
            }
          } catch (error) {
            console.error(
              'Error handling order event:',
              error
            );
          }
        }
      );
    }

    /*
    =====================================================
    MIDDLEWARES
    =====================================================
    */

    app.use(helmet());

    app.use(
      cors({
        origin:
          process.env.CORS_ORIGIN || '*',
        credentials: true,
      })
    );

    app.use(
      express.json({
        limit: '10mb',
      })
    );

    app.use(
      express.urlencoded({
        extended: true,
      })
    );

    app.use(morgan('combined'));

    app.use(requestLogger);

    /*
    =====================================================
    HEALTH CHECK
    =====================================================
    */

    app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',

        timestamp:
          new Date().toISOString(),

        uptime: process.uptime(),

        service: 'payment-service',

        database: 'connected',

        redis: redis.status,

        rabbitmq:
          process.env.NODE_ENV ===
          'test'
            ? 'mock'
            : channel
            ? 'connected'
            : 'disconnected',
      });
    });

    /*
    =====================================================
    METRICS
    =====================================================
    */

    app.get(
      '/metrics',
      async (_req, res) => {
        res.set(
          'Content-Type',
          'text/plain'
        );

        res.send(
          '# Metrics available through prom-client'
        );
      }
    );

    /*
    =====================================================
    ROUTES
    =====================================================
    */

    app.use(
      '/api/payments',
      paymentRoutes
    );

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

    if (
      process.env.NODE_ENV !== 'test'
    ) {
      app.listen(PORT, () => {
        console.log(
          `Payment Service running on port ${PORT}`
        );

        console.log(
          `Environment: ${process.env.NODE_ENV}`
        );
      });
    }
  } catch (error) {
    console.error(
      'Failed to start server:',
      error
    );

    process.exit(1);
  }
};

/*
=====================================================
GRACEFUL SHUTDOWN
=====================================================
*/

process.on('SIGTERM', async () => {
  await prisma.$disconnect();

  if (
    process.env.NODE_ENV !== 'test'
  ) {
    await redis.quit();
  }

  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();

  if (
    process.env.NODE_ENV !== 'test'
  ) {
    await redis.quit();
  }

  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
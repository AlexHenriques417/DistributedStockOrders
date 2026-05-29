import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import amqp, { Channel } from 'amqplib';

import inventoryRoutes from './routes/inventoryRoutes';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import {
  setupRabbitMQ,
  consumeCatalogEvents,
} from './config/rabbitmq';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3003;

export const prisma = new PrismaClient();

// CORRIGIDO: Usar REDIS_URL diretamente
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

const startServer = async (): Promise<void> => {
  try {
    // RabbitMQ connection
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost:5672'
    );

    channel = await connection.createChannel();

    await setupRabbitMQ(channel);

    console.log('Connected to RabbitMQ');

    app.set('rabbitmqChannel', channel);

    // Consume catalog events
    await consumeCatalogEvents(
      channel,
      async (message: any): Promise<void> => {
        console.log(
          'Received catalog event:',
          message
        );

        // Product created event
        if (
          message.event === 'catalog.product.created'
        ) {
          try {
            await prisma.inventoryItem.create({
              data: {
                productId: message.data.productId,
                sku:
                  message.data.sku ||
                  message.data.productId,

                name: message.data.name,

                description:
                  message.data.description,

                quantity: 0,
                reservedQty: 0,
                availableQty: 0,

                reorderPoint: parseInt(
                  process.env
                    .LOW_STOCK_THRESHOLD || '10'
                ),

                reorderQty: 50,

                unitCost:
                  Number(message.data.price) || 0,
              },
            });

            console.log(
              `Created inventory item for product: ${message.data.productId}`
            );
          } catch (error) {
            console.error(
              'Failed to create inventory item:',
              error
            );
          }
        }
      }
    );

    // Security middlewares
    app.use(helmet());

    app.use(
      cors({
        origin:
          process.env.CORS_ORIGIN || '*',
        credentials: true,
      })
    );

    // Body parser
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

    // Logs
    app.use(morgan('combined'));
    app.use(requestLogger);

    // Health check
    app.get(
      '/health',
      (
        req: Request,
        res: Response
      ): Response => {
        return res.status(200).json({
          status: 'healthy',
          timestamp:
            new Date().toISOString(),

          uptime: process.uptime(),

          service: 'inventory-service',

          database: 'connected',

          redis: redis.status,

          rabbitmq: channel
            ? 'connected'
            : 'disconnected',
        });
      }
    );

    // Metrics
    app.get(
      '/metrics',
      async (
        req: Request,
        res: Response
      ): Promise<Response> => {
        res.set(
          'Content-Type',
          'text/plain'
        );

        return res.send(
          '# Metrics available through prom-client'
        );
      }
    );

    // Routes
    app.use(
      '/api/inventory',
      inventoryRoutes
    );

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      console.log(
        `Inventory Service running on port ${PORT}`
      );

      console.log(
        `Environment: ${process.env.NODE_ENV}`
      );
    });
  } catch (error) {
    console.error(
      'Failed to start server:',
      error
    );

    process.exit(1);
  }
};

// Graceful shutdown
process.on(
  'SIGTERM',
  async (): Promise<void> => {
    console.log(
      'SIGTERM signal received: closing HTTP server'
    );

    await prisma.$disconnect();

    await redis.quit();

    process.exit(0);
  }
);

process.on(
  'SIGINT',
  async (): Promise<void> => {
    console.log(
      'SIGINT signal received: closing HTTP server'
    );

    await prisma.$disconnect();

    await redis.quit();

    process.exit(0);
  }
);

startServer();

export default app;
import express from 'express';
import request from 'supertest';

import paymentRoutes from '../routes/paymentRoutes';

describe('Payment Routes', () => {
  const app = express();

  app.use(express.json());

  app.use((req: any, _res, next) => {
    req.user = {
      id: '1',
      role: 'admin'
    };

    next();
  });

  app.use(
    '/api/payments',
    paymentRoutes
  );

  test('rotas carregam', async () => {
    const response =
      await request(app).get(
        '/api/payments'
      );

    expect(response.status).toBeDefined();
  });
});
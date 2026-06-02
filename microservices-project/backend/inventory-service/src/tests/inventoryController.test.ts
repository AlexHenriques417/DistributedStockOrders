import express from 'express';
import request from 'supertest';

import inventoryRoutes from '../routes/inventoryRoutes';

describe('Inventory Routes', () => {
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
    '/api/inventory',
    inventoryRoutes
  );

  test('rota responde', async () => {
    const response =
      await request(app).get(
        '/api/inventory'
      );

    expect(response.status).toBeDefined();
  });
});
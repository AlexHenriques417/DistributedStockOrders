import express from 'express';
import request from 'supertest';
import axios from 'axios';
import userRoutes from '../routes/userRoutes';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('User Routes', () => {
  const app = express();

  app.use(express.json());

  app.use((req: any, res, next) => {
    req.user = {
      id: '123'
    };

    next();
  });

  app.use('/users', userRoutes);

  test('GET /profile', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        id: '123'
      }
    });

    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
  });

  test('GET /:id', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        id: '456'
      }
    });

    const response = await request(app)
      .get('/users/456')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
  });
});
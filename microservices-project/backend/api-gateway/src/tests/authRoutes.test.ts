import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/authRoutes';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth Routes', () => {
  const app = express();

  app.use(express.json());
  app.use('/auth', authRoutes);

  test('POST /register', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true
      }
    });

    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'teste@test.com'
      });

    expect(response.status).toBe(201);
  });

  test('POST /login', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        token: 'abc'
      }
    });

    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'teste@test.com',
        password: '123'
      });

    expect(response.status).toBe(200);
  });
});
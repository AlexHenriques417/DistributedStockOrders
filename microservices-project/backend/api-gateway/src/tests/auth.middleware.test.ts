import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

describe('Auth Middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('deve autenticar token válido', async () => {
    const token = jwt.sign(
      {
        id: '1',
        email: 'test@test.com',
        role: 'user'
      },
      process.env.JWT_SECRET!
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res: any = {};

    await authMiddleware(req, res, next);

    expect(req.user.id).toBe('1');
    expect(next).toHaveBeenCalled();
  });

  test('deve falhar sem token', async () => {
    const req: any = {
      headers: {}
    };

    const res: any = {};

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();

    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(ApiError);
  });
});
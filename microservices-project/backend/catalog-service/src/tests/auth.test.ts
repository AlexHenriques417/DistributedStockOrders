import jwt from 'jsonwebtoken';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

describe('Auth Middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('token válido', async () => {
    const token = jwt.sign(
      {
        id: '1',
        email: 'admin@test.com',
        role: 'admin'
      },
      process.env.JWT_SECRET!
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    await authMiddleware(req, {} as any, next);

    expect(req.user.id).toBe('1');
    expect(next).toHaveBeenCalled();
  });

  test('sem token', async () => {
    const req: any = {
      headers: {}
    };

    await authMiddleware(req, {} as any, next);

    expect(next).toHaveBeenCalled();

    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(ApiError);
  });

  test('role middleware', () => {
    const req: any = {
      user: {
        role: 'admin'
      }
    };

    roleMiddleware('admin')(req, {} as any, next);

    expect(next).toHaveBeenCalled();
  });
});
import jwt from 'jsonwebtoken';
import {
  authMiddleware,
  roleMiddleware
} from '../middleware/auth';

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
        role: 'admin'
      },
      process.env.JWT_SECRET!
    );

    const req: any = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    await authMiddleware(
      req,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  test('role middleware', () => {
    const req: any = {
      user: {
        role: 'admin'
      }
    };

    roleMiddleware('admin')(
      req,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalled();
  });
});
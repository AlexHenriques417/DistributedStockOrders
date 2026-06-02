import {
  ApiError,
  errorHandler,
  notFoundHandler
} from '../middleware/errorHandler';

describe('ErrorHandler', () => {
  test('ApiError', () => {
    const err = new ApiError(
      400,
      'Teste'
    );

    expect(err.statusCode).toBe(400);
  });

  test('notFoundHandler', () => {
    const next = jest.fn();

    notFoundHandler(
      {
        originalUrl: '/fake'
      } as any,
      {} as any,
      next
    );

    expect(next).toHaveBeenCalled();
  });

  test('errorHandler', () => {
    const json = jest.fn();

    const res: any = {
      status: jest.fn(() => ({
        json
      }))
    };

    errorHandler(
      new ApiError(500, 'Erro'),
      {} as any,
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalled();
  });
});
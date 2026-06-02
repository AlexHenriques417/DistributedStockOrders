import {
  ApiError,
  errorHandler,
  notFoundHandler
} from '../middleware/errorHandler';

describe('Error Handler', () => {
  test('ApiError', () => {
    const error = new ApiError(404, 'Not Found');

    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  test('NotFoundHandler', () => {
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
      new ApiError(400, 'Erro'),
      {} as any,
      res,
      jest.fn()
    );

    expect(res.status).toHaveBeenCalled();
  });
});
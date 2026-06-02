import {
  ApiError,
  notFoundHandler
} from '../middleware/errorHandler';

describe('ErrorHandler', () => {
  test('ApiError', () => {
    const err = new ApiError(
      400,
      'Erro'
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
});
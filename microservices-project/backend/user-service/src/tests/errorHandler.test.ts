import {
  ApiError
} from '../middleware/errorHandler';

describe('ErrorHandler', () => {
  test('ApiError', () => {
    const err = new ApiError(
      400,
      'Erro'
    );

    expect(err.statusCode).toBe(400);
  });
});
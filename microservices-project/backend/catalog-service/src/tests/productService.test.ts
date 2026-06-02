import { ApiError } from '../middleware/errorHandler';

describe('ProductService', () => {
  test('ApiError funciona', () => {
    const error = new ApiError(
      409,
      'Produto já existe'
    );

    expect(error.statusCode).toBe(409);
  });
});
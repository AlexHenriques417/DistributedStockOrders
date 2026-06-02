import {
  ApiError,
  errorHandler,
  notFoundHandler
} from '../middleware/errorHandler';

describe('Error Handler', () => {
  test('ApiError deve criar erro operacional', () => {
    const error = new ApiError(400, 'Erro teste');

    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  test('notFoundHandler deve gerar 404', () => {
    const next = jest.fn();

    const req: any = {
      originalUrl: '/rota-inexistente'
    };

    const res: any = {};

    notFoundHandler(req, res, next);

    expect(next).toHaveBeenCalled();

    const error = next.mock.calls[0][0];

    expect(error.statusCode).toBe(404);
  });

  test('errorHandler retorna erro operacional', () => {
    const req: any = {};
    const next = jest.fn();

    const json = jest.fn();

    const res: any = {
      status: jest.fn(() => ({
        json
      }))
    };

    const err = new ApiError(400, 'Erro teste');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalled();
  });
});
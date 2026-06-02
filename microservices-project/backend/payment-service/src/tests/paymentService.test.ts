import paymentService from '../services/paymentService';

describe('Payment Service', () => {
  test('service carregado', () => {
    expect(paymentService).toBeDefined();
  });
});
import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';

const service = new PaymentService();

export class PaymentController {
  async process(req: Request, res: Response) {
    try {
      const { orderId, amount, paymentMethod, cardNumber } = req.body;
      const payment = await service.processPayment({ orderId, amount, paymentMethod, cardNumber });

      const statusCode = payment.status === 'APPROVED' ? 200 : 402;
      return res.status(statusCode).json(payment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const payment = await service.findByOrderId(req.params.orderId);
      if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });
      return res.status(200).json(payment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
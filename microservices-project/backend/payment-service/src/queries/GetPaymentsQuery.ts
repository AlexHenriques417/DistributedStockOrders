import { Payment } from '../models/Payment';

export class GetPaymentsQuery {
  async findByOrderId(orderId: string): Promise<Payment | null> {
    return await Payment.findOne({ where: { orderId } });
  }

  async findAll(): Promise<Payment[]> {
    return await Payment.findAll({ order: [['createdAt', 'DESC']] });
  }
}

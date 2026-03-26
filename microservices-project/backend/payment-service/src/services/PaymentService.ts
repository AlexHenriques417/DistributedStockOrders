import { Payment } from '../models/Payment';
import amqp from 'amqplib';

interface ProcessPaymentDTO {
  orderId: string;
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
}

export class PaymentService {
  async processPayment(data: ProcessPaymentDTO) {
    const isApproved = Math.random() > 0.1; // 90% de chance de aprovar

    const payment = await Payment.create({
      orderId: data.orderId,
      amount: data.amount,
      status: isApproved ? 'APPROVED' : 'REFUSED'
    });

    await this.publishPaymentResult(payment);

    return payment;
  }

  async findByOrderId(orderId: string) {
    return await Payment.findOne({ where: { orderId } });
  }

  private async publishPaymentResult(payment: Payment) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      const exchange = 'payment_events';

      await channel.assertExchange(exchange, 'topic', { durable: true });

      const routingKey = payment.status === 'APPROVED' ? 'payment.approved' : 'payment.refused';

      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify({
        paymentId: payment.id,
        orderId: payment.orderId,
        status: payment.status
      })));

      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('⚠️ RabbitMQ indisponível, evento não emitido:', err);
    }
  }
}
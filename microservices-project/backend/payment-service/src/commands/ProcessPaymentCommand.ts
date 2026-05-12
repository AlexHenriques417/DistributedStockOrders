import { Payment } from '../models/Payment';
import amqp from 'amqplib';

export interface ProcessPaymentInput {
  orderId: string;
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
}

/**
 * CQRS - COMMAND: Processa o pagamento e publica o resultado via evento.
 */
export class ProcessPaymentCommand {
  async execute(data: ProcessPaymentInput): Promise<Payment> {
    const isApproved = Math.random() > 0.1; // 90% de aprovação

    const payment = await Payment.create({
      orderId: data.orderId,
      amount:  data.amount,
      status:  isApproved ? 'APPROVED' : 'REFUSED'
    });

    await this.publishPaymentResult(payment);
    console.log(`[COMMAND] Pagamento ${payment.status} para pedido: ${data.orderId}`);
    return payment;
  }

  private async publishPaymentResult(payment: Payment) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel    = await connection.createChannel();
      const exchange   = 'payment_events';

      await channel.assertExchange(exchange, 'topic', { durable: true });

      const routingKey = payment.status === 'APPROVED' ? 'payment.approved' : 'payment.refused';
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify({
        paymentId: payment.id,
        orderId:   payment.orderId,
        status:    payment.status
      })));

      console.log(`[EVENT] ${routingKey} publicado para pedido: ${payment.orderId}`);
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('[WARN] Evento de pagamento não publicado:', err);
    }
  }
}

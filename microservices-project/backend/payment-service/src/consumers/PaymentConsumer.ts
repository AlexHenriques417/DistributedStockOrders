import amqp from 'amqplib';
import { Payment } from '../models/Payment';

export class PaymentConsumer {
  async listen() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    
    const exchange = 'order_events';
    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const q = await channel.assertQueue('payment_queue');
    await channel.bindQueue(q.queue, exchange, 'order.created');

    console.log('💳 Payment Service aguardando ordens para processar...');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        const orderData = JSON.parse(msg.content.toString());
        
        console.log(`💸 Processando pagamento do pedido: ${orderData.orderId}`);

        // Simulação de lógica de pagamento (90% de chance de aprovar)
        const isApproved = Math.random() > 0.1;

        const payment = await Payment.create({
          orderId: orderData.orderId,
          amount: orderData.totalAmount,
          status: isApproved ? 'APPROVED' : 'REFUSED'
        });

        // Evento de Negócio: Pagamento Processado
        await this.publishPaymentResult(payment);

        channel.ack(msg);
      }
    });
  }

  private async publishPaymentResult(payment: Payment) {
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
  }
}
import amqp from 'amqplib';
import { UpdateOrderStatusCommand } from '../commands/UpdateOrderStatusCommand';
import { OrderGateway } from '../gateway/OrderGateway';

// AULA 10: recebe o gateway via injecao de dependencia.
// Fluxo: RabbitMQ -> Consumer -> Command -> DB -> Cache -> Socket.io -> Browser
export class OrderConsumer {
  constructor(private gateway: OrderGateway | null = null) {}

  async listen() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel    = await connection.createChannel();
    await channel.assertExchange('payment_events', 'topic', { durable: true });

    const approvedQ = await channel.assertQueue('order_payment_approved_queue', { durable: true });
    await channel.bindQueue(approvedQ.queue, 'payment_events', 'payment.approved');

    const refusedQ = await channel.assertQueue('order_payment_refused_queue', { durable: true });
    await channel.bindQueue(refusedQ.queue, 'payment_events', 'payment.refused');

    console.log('Order Consumer aguardando eventos de pagamento...');

    channel.consume(approvedQ.queue, async (msg) => {
      if (!msg) return;
      try {
        const { orderId } = JSON.parse(msg.content.toString());
        await new UpdateOrderStatusCommand(this.gateway).execute(orderId, 'PAID');
        channel.ack(msg);
      } catch (err) {
        console.error('Erro payment.approved:', err);
        channel.nack(msg, false, true);
      }
    });

    channel.consume(refusedQ.queue, async (msg) => {
      if (!msg) return;
      try {
        const { orderId } = JSON.parse(msg.content.toString());
        await new UpdateOrderStatusCommand(this.gateway).execute(orderId, 'CANCELED');
        channel.ack(msg);
      } catch (err) {
        console.error('Erro payment.refused:', err);
        channel.nack(msg, false, true);
      }
    });
  }
}
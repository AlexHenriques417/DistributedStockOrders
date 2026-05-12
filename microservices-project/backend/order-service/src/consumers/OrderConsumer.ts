import amqp from 'amqplib';
import { UpdateOrderStatusCommand } from '../commands/UpdateOrderStatusCommand';

/**
 * Consumer responsável por escutar eventos do payment-service.
 * Implementa CONSISTÊNCIA EVENTUAL: o order-service não sabe imediatamente
 * se o pagamento foi aprovado — ele recebe essa informação via evento.
 */
export class OrderConsumer {
  private updateStatusCommand = new UpdateOrderStatusCommand();

  async listen() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel    = await connection.createChannel();
    const exchange   = 'payment_events';

    await channel.assertExchange(exchange, 'topic', { durable: true });

    // Fila para eventos de pagamento aprovado
    const approvedQueue = await channel.assertQueue('order_payment_approved_queue', { durable: true });
    await channel.bindQueue(approvedQueue.queue, exchange, 'payment.approved');

    // Fila para eventos de pagamento recusado
    const refusedQueue = await channel.assertQueue('order_payment_refused_queue', { durable: true });
    await channel.bindQueue(refusedQueue.queue, exchange, 'payment.refused');

    console.log('📥 Order Service aguardando eventos de pagamento (consistência eventual)...');

    // Consome pagamentos APROVADOS → atualiza pedido para PAID
    channel.consume(approvedQueue.queue, async (msg) => {
      if (!msg) return;
      try {
        const { orderId } = JSON.parse(msg.content.toString());
        await this.updateStatusCommand.execute(orderId, 'PAID');
        console.log(`✅ [EVENTUAL] Pedido ${orderId} marcado como PAID`);
        channel.ack(msg);
      } catch (err) {
        console.error('❌ Erro ao processar payment.approved:', err);
        channel.nack(msg, false, true); // requeue
      }
    });

    // Consome pagamentos RECUSADOS → atualiza pedido para CANCELED
    channel.consume(refusedQueue.queue, async (msg) => {
      if (!msg) return;
      try {
        const { orderId } = JSON.parse(msg.content.toString());
        await this.updateStatusCommand.execute(orderId, 'CANCELED');
        console.log(`❌ [EVENTUAL] Pedido ${orderId} marcado como CANCELED`);
        channel.ack(msg);
      } catch (err) {
        console.error('❌ Erro ao processar payment.refused:', err);
        channel.nack(msg, false, true); // requeue
      }
    });
  }
}

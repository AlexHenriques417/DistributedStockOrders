import { Order } from '../models/Order';
import amqp from 'amqplib';

export interface CreateOrderInput {
  userId: string;
  productId: string;
  quantity: number;
  price: number;
}

/**
 * CQRS - COMMAND: Responsável apenas por ESCREVER no banco.
 * Cria o pedido e publica o evento order.created no RabbitMQ.
 */
export class CreateOrderCommand {
  async execute(data: CreateOrderInput): Promise<Order> {
    const order = await Order.create({
      userId:     data.userId,
      productId:  data.productId,
      quantity:   data.quantity,
      totalPrice: data.price * data.quantity,
      status:     'PENDING'
    });

    await this.publishOrderCreated(order);
    console.log(`[COMMAND] Pedido criado: ${order.id} | Status: PENDING`);
    return order;
  }

  private async publishOrderCreated(order: Order) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel    = await connection.createChannel();
      const exchange   = 'order_events';

      await channel.assertExchange(exchange, 'topic', { durable: true });
      channel.publish(exchange, 'order.created', Buffer.from(JSON.stringify({
        orderId:     order.id,
        productId:   order.productId,
        quantity:    order.quantity,
        totalAmount: order.totalPrice
      })));

      console.log(`[EVENT] order.created publicado para o pedido: ${order.id}`);
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('[WARN] RabbitMQ indisponível, evento order.created não emitido:', err);
    }
  }
}

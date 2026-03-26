import { Order } from '../models/Order';
import amqp from 'amqplib';

export class OrderService {
  async findAll() {
    return await Order.findAll();
  }

  async findById(id: string) {
    return await Order.findByPk(id);
  }

  async createOrder(data: any) {
    const order = await Order.create({
      userId:     data.userId,
      productId:  data.productId,
      quantity:   data.quantity,
      totalPrice: data.price * data.quantity,
      status:     'PENDING'
    });

    await this.publishOrderCreated(order);

    return order;
  }

  async updateStatus(id: string, status: string) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    order.status = status;
    await order.save();
    return order;
  }

  private async publishOrderCreated(order: Order) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      const exchange = 'order_events';

      await channel.assertExchange(exchange, 'topic', { durable: true });

      channel.publish(exchange, 'order.created', Buffer.from(JSON.stringify({
        orderId:     order.id,
        productId:   order.productId,
        quantity:    order.quantity,
        totalAmount: order.totalPrice
      })));

      console.log(`📦 Evento 'order.created' enviado para o pedido: ${order.id}`);

      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('⚠️ RabbitMQ indisponível, evento não emitido:', err);
    }
  }
}
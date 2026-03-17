import { Order } from '../models/Order';
import amqp from 'amqplib';

export class OrderService {
  async createOrder(data: any) {
    // 1. Cria o pedido no banco com status Pendente
    const order = await Order.create({
      userId: data.userId,
      productId: data.productId,
      quantity: data.quantity,
      totalPrice: data.price * data.quantity,
      status: 'PENDING'
    });

    // 2. Evento de Negócio: Pedido Criado
    // Isso inicia a Saga para validar estoque e pagamento
    await this.publishOrderCreated(order);

    return order;
  }

  private async publishOrderCreated(order: Order) {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const exchange = 'order_events';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    
    const payload = {
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      totalAmount: order.totalPrice
    };

    channel.publish(exchange, 'order.created', Buffer.from(JSON.stringify(payload)));
    console.log(`📦 Evento 'order.created' enviado para o pedido: ${order.id}`);
  }
}
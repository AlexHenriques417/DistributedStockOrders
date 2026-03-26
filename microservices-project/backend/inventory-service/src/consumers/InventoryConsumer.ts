import amqp from 'amqplib';
import { Inventory } from '../models/Inventory';

export class InventoryConsumer {
  async listen() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const exchange = 'catalog_events';

    await channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await channel.assertQueue('inventory_queue', { durable: true });
    await channel.bindQueue(q.queue, exchange, 'product.created');

    console.log('📥 Inventory Service aguardando eventos do Catálogo...');

    channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const product = JSON.parse(msg.content.toString());

          await Inventory.create({
            productId: product.id,
            quantity: product.stock_quantity || 0
          });

          console.log(`📦 Estoque inicial criado para o produto: ${product.name}`);
          channel.ack(msg);
        } catch (err) {
          console.error('❌ Erro ao processar evento product.created:', err);
          channel.nack(msg, false, false);
        }
      }
    });
  }
}
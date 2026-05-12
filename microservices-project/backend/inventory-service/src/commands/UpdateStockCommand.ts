import { Inventory } from '../models/Inventory';
import amqp from 'amqplib';

/**
 * CQRS - COMMAND: Atualiza estoque e publica evento de baixa.
 */
export class UpdateStockCommand {
  async upsert(productId: string, quantity: number): Promise<Inventory> {
    let item = await Inventory.findOne({ where: { productId } });
    if (!item) {
      item = await Inventory.create({ productId, quantity });
    } else {
      item.quantity += quantity;
      await item.save();
    }
    return item;
  }

  async decrease(productId: string, amount: number): Promise<Inventory> {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item || item.quantity < amount) {
      throw new Error('Estoque insuficiente');
    }
    item.quantity -= amount;
    await item.save();

    // Publica evento de baixa no estoque para outros serviços
    await this.publishStockUpdated(productId, item.quantity);
    return item;
  }

  async zero(productId: string): Promise<Inventory | null> {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item) return null;
    item.quantity = 0;
    await item.save();
    return item;
  }

  private async publishStockUpdated(productId: string, currentQuantity: number) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel    = await connection.createChannel();
      await channel.assertExchange('inventory_events', 'topic', { durable: true });
      channel.publish('inventory_events', 'stock.updated', Buffer.from(JSON.stringify({
        productId,
        currentQuantity,
        timestamp: new Date().toISOString()
      })));
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('[WARN] Evento stock.updated não publicado:', err);
    }
  }
}

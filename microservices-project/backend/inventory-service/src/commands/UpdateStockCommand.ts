import { Inventory } from '../models/Inventory';
import amqp from 'amqplib';
import { InventoryCacheService } from '../cache/InventoryCacheService';

export class UpdateStockCommand {
  private cache = new InventoryCacheService();

  // Corrigido: Definido o retorno como Promise de uma instância de Inventory
  async upsert(productId: string, quantity: number): Promise<Inventory> {
    let item = await Inventory.findOne({ where: { productId } });
    if (!item) {
      item = await Inventory.create({ productId, quantity });
    } else {
      item.quantity += quantity;
      await item.save();
    }
    await this.cache.invalidate(productId); // invalida APOS salvar
    return item;
  }

  // Corrigido: Definido o retorno como Promise de uma instância de Inventory
  async decrease(productId: string, amount: number): Promise<Inventory> {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item || item.quantity < amount) throw new Error('Estoque insuficiente');
    
    item.quantity -= amount;
    await item.save();
    await this.cache.invalidate(productId); // invalida APOS salvar
    await this.publishStockUpdated(productId, item.quantity);
    return item;
  }

  // Corrigido: Definido que pode retornar o Inventory ou null
  async zero(productId: string): Promise<Inventory | null> {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item) return null;
    
    item.quantity = 0;
    await item.save();
    await this.cache.invalidate(productId); // invalida APOS salvar
    return item;
  }

  // Corrigido: Como o método não possui retorno, ele retorna Promise<void>
  private async publishStockUpdated(productId: string, currentQuantity: number): Promise<void> {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      await channel.assertExchange('inventory_events', 'topic', { durable: true });
      
      channel.publish('inventory_events', 'stock.updated', Buffer.from(JSON.stringify({
        productId, currentQuantity, timestamp: new Date().toISOString()
      })));
      
      await channel.close();
      await connection.close();
    } catch (err) {
      console.warn('[WARN] Evento stock.updated nao publicado:', err);
    }
  }
}
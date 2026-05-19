import { Inventory } from '../models/Inventory';
import { InventoryCacheService } from '../cache/InventoryCacheService';

export class GetStockQuery {
  private cache = new InventoryCacheService();

  // Corrigido: Retorna uma lista de itens de estoque -> Promise<Inventory[]>
  async findAll(): Promise<Inventory[]> {
    // lista completa nao e cacheada (muda a cada venda)
    return await Inventory.findAll();
  }

  // Corrigido: Retorna um item de estoque ou null se não encontrar -> Promise<Inventory | null>
  async findByProduct(productId: string): Promise<Inventory | null> {
    const cached = await this.cache.getStock(productId);
    if (cached) return cached;
    
    const item = await Inventory.findOne({ where: { productId } });
    if (item) await this.cache.setStock(item.toJSON());
    return item;
  }
}
import { Inventory } from '../models/Inventory';

/**
 * CQRS - QUERY: Apenas leitura do estoque.
 */
export class GetStockQuery {
  async findAll(): Promise<Inventory[]> {
    return await Inventory.findAll();
  }

  async findByProduct(productId: string): Promise<Inventory | null> {
    return await Inventory.findOne({ where: { productId } });
  }
}

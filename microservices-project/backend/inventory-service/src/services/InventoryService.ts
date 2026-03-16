import { Inventory } from '../models/Inventory';

export class InventoryService {
  async getStockByProduct(productId: string) {
    return await Inventory.findOne({ where: { productId } });
  }

  async updateStock(productId: string, quantity: number) {
    const item = await Inventory.findOne({ where: { productId } });
    
    if (!item) throw new Error('Produto não encontrado no estoque');

    item.quantity += quantity;
    return await item.save();
  }

  // Método para o padrão Saga (Reduzir estoque ao criar pedido)
  async decreaseStock(productId: string, amount: number) {
    const item = await Inventory.findOne({ where: { productId } });
    
    if (!item || item.quantity < amount) {
      throw new Error('Estoque insuficiente');
    }

    item.quantity -= amount;
    return await item.save();
  }
}
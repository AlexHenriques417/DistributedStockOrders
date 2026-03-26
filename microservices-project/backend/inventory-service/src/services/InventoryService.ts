import { Inventory } from '../models/Inventory';

export class InventoryService {
  async findAll() {
    return await Inventory.findAll();
  }

  async getStockByProduct(productId: string) {
    return await Inventory.findOne({ where: { productId } });
  }

  async upsertStock(productId: string, quantity: number) {
    let item = await Inventory.findOne({ where: { productId } });

    if (!item) {
      item = await Inventory.create({ productId, quantity });
    } else {
      item.quantity += quantity;
      await item.save();
    }

    return item;
  }

  async zeroStock(productId: string) {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item) return null;
    item.quantity = 0;
    await item.save();
    return item;
  }

  async decreaseStock(productId: string, amount: number) {
    const item = await Inventory.findOne({ where: { productId } });
    if (!item || item.quantity < amount) {
      throw new Error('Estoque insuficiente');
    }
    item.quantity -= amount;
    return await item.save();
  }
}
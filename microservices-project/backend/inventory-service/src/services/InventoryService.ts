import { UpdateStockCommand } from '../commands/UpdateStockCommand';
import { GetStockQuery } from '../queries/GetStockQuery';

/**
 * InventoryService — orquestrador CQRS.
 */
export class InventoryService {
  private updateStockCommand = new UpdateStockCommand();
  private getStockQuery      = new GetStockQuery();

  // QUERIES
  async findAll() {
    return this.getStockQuery.findAll();
  }

  async getStockByProduct(productId: string) {
    return this.getStockQuery.findByProduct(productId);
  }

  // COMMANDS
  async upsertStock(productId: string, quantity: number) {
    return this.updateStockCommand.upsert(productId, quantity);
  }

  async zeroStock(productId: string) {
    return this.updateStockCommand.zero(productId);
  }

  async decreaseStock(productId: string, amount: number) {
    return this.updateStockCommand.decrease(productId, amount);
  }
}

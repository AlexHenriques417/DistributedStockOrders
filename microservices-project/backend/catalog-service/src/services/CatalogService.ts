import { CreateProductCommand } from '../commands/CreateProductCommand';
import { UpdateProductCommand } from '../commands/UpdateProductCommand';
import { DeleteProductCommand } from '../commands/DeleteProductCommand';
import { GetProductsQuery } from '../queries/GetProductsQuery';
import { CreateProductDTO } from '../dtos/ProductDTO';

/**
 * CatalogService — orquestrador CQRS.
 * Operações de leitura usam Queries (com cache Redis).
 * Operações de escrita usam Commands (invalidam cache e emitem eventos).
 */
export class CatalogService {
  private createProductCommand = new CreateProductCommand();
  private updateProductCommand = new UpdateProductCommand();
  private deleteProductCommand = new DeleteProductCommand();
  private getProductsQuery     = new GetProductsQuery();

  // QUERIES
  async getAllProducts() {
    return this.getProductsQuery.findAll();
  }

  async getProductById(id: string) {
    return this.getProductsQuery.findById(id);
  }

  // COMMANDS
  async create(data: CreateProductDTO) {
    return this.createProductCommand.execute(data);
  }

  async update(id: string, data: Partial<{ name: string; price: number; description: string }>) {
    return this.updateProductCommand.execute(id, data);
  }

  async delete(id: string) {
    return this.deleteProductCommand.execute(id);
  }
}

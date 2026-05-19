import { Product } from '../models/Product';
import { ProductCacheService } from '../cache/ProductCacheService';

export class DeleteProductCommand {
  private cache = new ProductCacheService();

  // Corrigido: Definido que a Promise retorna um booleano (true ou false)
  async execute(id: string): Promise<boolean> {
    const deleted = await Product.destroy({ where: { id } });
    if (deleted === 0) return false;
    
    await this.cache.invalidate(id);      // invalida APOS deletar do banco
    console.log(`[COMMAND] Produto deletado: ${id}`);
    return true;
  }
}
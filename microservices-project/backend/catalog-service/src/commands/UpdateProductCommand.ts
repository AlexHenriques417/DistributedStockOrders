import { Product } from '../models/Product';
import { ProductCacheService } from '../cache/ProductCacheService';

export class UpdateProductCommand {
  private cache = new ProductCacheService();

  // Corrigido: Definido que a Promise retorna o Product atualizado ou null
  async execute(id: string, data: Partial<{ name: string; price: number; description: string }>): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) return null;
    
    await product.update(data);           // 1. banco
    await this.cache.invalidate(id);      // 2. cache (APOS commit)
    
    console.log(`[COMMAND] Produto atualizado: ${id}`);
    return product;
  }
}
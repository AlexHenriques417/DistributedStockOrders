import { Product } from '../models/Product';
import { CreateProductDTO } from '../dtos/ProductDTO';
import { CatalogProducer } from '../producers/CatalogProducer';
import { ProductCacheService } from '../cache/ProductCacheService';

const producer = new CatalogProducer();

export class CreateProductCommand {
  private cache = new ProductCacheService();

  // Corrigido: Definido que o retorno da Promise é a instância do Product criado
  async execute(data: CreateProductDTO): Promise<Product> {
    // 1. Persiste no banco
    const product = await Product.create(data as any);
    
    // 2. Publica evento para inventory-service criar estoque inicial
    await producer.emitProductCreated(product);
    
    // 3. Invalida cache APOS o commit (nunca antes!)
    await this.cache.invalidate(product.id);
    
    console.log(`[COMMAND] Produto criado: ${product.id}`);
    return product;
  }
}
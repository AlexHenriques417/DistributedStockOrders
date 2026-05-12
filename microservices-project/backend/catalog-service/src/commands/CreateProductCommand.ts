import { Product } from '../models/Product';
import { CreateProductDTO } from '../dtos/ProductDTO';
import { CatalogProducer } from '../producers/CatalogProducer';
import Redis from 'ioredis';

const redis    = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const producer = new CatalogProducer();

/**
 * CQRS - COMMAND: Cria produto, invalida cache e publica evento.
 */
export class CreateProductCommand {
  async execute(data: CreateProductDTO): Promise<Product> {
    const product = await Product.create(data as any);

    // Invalida o cache de listagem
    await redis.del('catalog:all_products');

    // Publica evento para o inventory-service criar o estoque inicial
    await producer.emitProductCreated(product);

    console.log(`[COMMAND] Produto criado: ${product.id}`);
    return product;
  }
}

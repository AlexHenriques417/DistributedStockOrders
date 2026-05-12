import { Product } from '../models/Product';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * CQRS - QUERY: Apenas leitura. Usa Redis como cache (Read Model).
 */
export class GetProductsQuery {
  async findAll(): Promise<Product[]> {
    const CACHE_KEY  = 'catalog:all_products';
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      console.log('[QUERY] Cache HIT: catalog:all_products');
      return JSON.parse(cachedData);
    }

    const products = await Product.findAll();
    await redis.setex(CACHE_KEY, 600, JSON.stringify(products));
    console.log('[QUERY] Cache MISS: catalog:all_products — dados buscados do DB');
    return products;
  }

  async findById(id: string): Promise<Product | null> {
    const CACHE_KEY  = `catalog:product:${id}`;
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      console.log(`[QUERY] Cache HIT: ${CACHE_KEY}`);
      return JSON.parse(cachedData);
    }

    const product = await Product.findByPk(id);
    if (product) {
      await redis.setex(CACHE_KEY, 600, JSON.stringify(product));
    }
    return product;
  }
}

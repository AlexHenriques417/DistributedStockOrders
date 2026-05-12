import { Product } from '../models/Product';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class UpdateProductCommand {
  async execute(id: string, data: Partial<{ name: string; price: number; description: string }>): Promise<Product | null> {
    const product = await Product.findByPk(id);
    if (!product) return null;

    await product.update(data);
    await redis.del('catalog:all_products');
    await redis.del(`catalog:product:${id}`);

    console.log(`[COMMAND] Produto atualizado: ${id}`);
    return product;
  }
}

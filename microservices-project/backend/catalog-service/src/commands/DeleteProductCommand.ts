import { Product } from '../models/Product';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class DeleteProductCommand {
  async execute(id: string): Promise<boolean> {
    const deleted = await Product.destroy({ where: { id } });
    if (deleted === 0) return false;

    await redis.del('catalog:all_products');
    await redis.del(`catalog:product:${id}`);

    console.log(`[COMMAND] Produto deletado: ${id}`);
    return true;
  }
}

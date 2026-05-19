import Redis from 'ioredis';

export class InventoryCacheService {
  private readonly redis: Redis;
  private readonly TTL = 120; // 2 minutos

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redis.on('error', (err) => console.error('[InvCache] Erro Redis:', err.message));
  }

  // Corrigido: Definido que a Promise retorna o objeto genérico (any) ou null
  async getStock(productId: string): Promise<any | null> {
    const data = await this.redis.get(`inventory:${productId}`);
    if (data) { 
      console.log(`[InvCache] HIT  inventory:${productId}`); 
      return JSON.parse(data); 
    }
    console.log(`[InvCache] MISS inventory:${productId}`);
    return null;
  }

  // Corrigido: Operações de escrita retornam uma Promise vazia (void)
  async setStock(item: any): Promise<void> {
    await this.redis.setex(`inventory:${item.productId}`, this.TTL, JSON.stringify(item));
    console.log(`[InvCache] SET  inventory:${item.productId} (TTL ${this.TTL}s)`);
  }

  // Corrigido: Operação de deleção retorna uma Promise vazia (void)
  async invalidate(productId: string): Promise<void> {
    await this.redis.del(`inventory:${productId}`);
    console.log(`[InvCache] INVALIDADO inventory:${productId}`);
  }
}
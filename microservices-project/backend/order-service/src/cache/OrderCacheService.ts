import Redis from 'ioredis';

// Cache de pedidos. TTL 30s porque status muda com frequencia.
export class OrderCacheService {
  private readonly redis: Redis;
  private readonly TTL = 30;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redis.on('error', (err) => console.error('[OrderCache] Erro Redis:', err.message));
  }

  // Corrigido: Definido que retorna o objeto (any) ou null em caso de MISS
  async getOrder(id: string): Promise<any | null> {
    const data = await this.redis.get(`order:${id}`);
    if (data) { 
      console.log(`[OrderCache] HIT  order:${id}`); 
      return JSON.parse(data); 
    }
    console.log(`[OrderCache] MISS order:${id}`);
    return null;
  }

  // Corrigido: Operação de escrita tipada como Promise<void>
  async setOrder(order: any): Promise<void> {
    await this.redis.setex(`order:${order.id}`, this.TTL, JSON.stringify(order));
    console.log(`[OrderCache] SET  order:${order.id} (TTL ${this.TTL}s)`);
  }

  // Corrigido: Operação de deleção tipada como Promise<void>
  async invalidate(id: string): Promise<void> {
    await this.redis.del(`order:${id}`);
    console.log(`[OrderCache] INVALIDADO order:${id}`);
  }
}
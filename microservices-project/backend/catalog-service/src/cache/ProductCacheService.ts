import Redis from 'ioredis';

export class ProductCacheService {
  private readonly redis: Redis;
  private readonly TTL_ITEM = 300;  // 5 minutos
  private readonly TTL_LIST = 600;  // 10 minutos

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redis.on('connect', () => console.log('[Cache] Conectado ao Redis'));
    this.redis.on('error', (err) => console.error('[Cache] Erro Redis:', err.message));
  }

  // Corrigido: Definido que a Promise retorna um objeto genérico (any) ou null
  async getProduct(id: string): Promise<any | null> {
    const data = await this.redis.get(`catalog:product:${id}`);
    if (data) { 
      console.log(`[Cache] HIT  catalog:product:${id}`); 
      return JSON.parse(data); 
    }
    console.log(`[Cache] MISS catalog:product:${id}`);
    return null;
  }

  // Corrigido: Definido que retorna uma lista (any[]) ou null
  async getAllProducts(): Promise<any[] | null> {
    const data = await this.redis.get('catalog:all_products');
    if (data) { 
      console.log('[Cache] HIT  catalog:all_products'); 
      return JSON.parse(data); 
    }
    console.log('[Cache] MISS catalog:all_products');
    return null;
  }

  // Corrigido: Operações de salvamento e deleção retornam Promise<void> (nada)
  async setProduct(product: any): Promise<void> {
    await this.redis.setex(`catalog:product:${product.id}`, this.TTL_ITEM, JSON.stringify(product));
    console.log(`[Cache] SET  catalog:product:${product.id} (TTL ${this.TTL_ITEM}s)`);
  }

  async setAllProducts(products: any[]): Promise<void> {
    await this.redis.setex('catalog:all_products', this.TTL_LIST, JSON.stringify(products));
    console.log(`[Cache] SET  catalog:all_products (TTL ${this.TTL_LIST}s)`);
  }

  async invalidate(id: string): Promise<void> {
    await this.redis.del(`catalog:product:${id}`, 'catalog:all_products');
    console.log(`[Cache] INVALIDADO produto:${id} + lista`);
  }

  // Corrigido: Definido o Record com <string, string>
  async getStats(): Promise<Record<string, string>> {
    const info: string = await this.redis.info('stats'); // Forçado o tipo string aqui
    const stats: Record<string, string> = {}; // Corrigido a tipagem do objeto
    
    for (const line of info.split('\r\n')) {
      if (line.startsWith('keyspace_hits') || line.startsWith('keyspace_misses')) {
        const [k, v] = line.split(':');
        if (k && v) { // Validação de segurança para o TS
          stats[k] = v;
        }
      }
    }
    const keys = await this.redis.keys('catalog:*');
    stats['active_catalog_keys'] = String(keys.length);
    return stats;
  }
}
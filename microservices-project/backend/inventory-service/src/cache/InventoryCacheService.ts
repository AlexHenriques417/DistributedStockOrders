import IORedis from 'ioredis';

export class OrderCacheService {
  private redis: IORedis;

  constructor() {
    this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async getOrder(orderId: string) {
    const cached = await this.redis.get(`order:${orderId}`);
    if (cached) {
      console.log(`[CACHE HIT] Order ${orderId}`);
      return JSON.parse(cached);
    }
    return null;
  }

  async setOrder(orderId: string, data: any, ttl = 7200) {
    await this.redis.setex(
      `order:${orderId}`,
      ttl,
      JSON.stringify(data)
    );
  }

  async cacheOrderList(userId: string, orders: any[], ttl = 1800) {
    await this.redis.setex(
      `user_orders:${userId}`,
      ttl,
      JSON.stringify(orders)
    );
  }

  async getUserOrders(userId: string) {
    const cached = await this.redis.get(`user_orders:${userId}`);
    if (cached) {
      console.log(`[CACHE HIT] User Orders ${userId}`);
      return JSON.parse(cached);
    }
    return null;
  }

  async invalidateOrder(orderId: string) {
    await this.redis.del(`order:${orderId}`);
  }

  async invalidateUserOrders(userId: string) {
    await this.redis.del(`user_orders:${userId}`);
  }
}
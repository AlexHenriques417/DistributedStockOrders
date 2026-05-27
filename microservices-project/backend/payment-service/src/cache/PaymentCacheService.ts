import IORedis from 'ioredis';

export class PaymentCacheService {
  private redis: IORedis;

  constructor() {
    this.redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async getPayment(paymentId: string) {
    const cached = await this.redis.get(`payment:${paymentId}`);
    if (cached) {
      console.log(`[CACHE HIT] Payment ${paymentId}`);
      return JSON.parse(cached);
    }
    return null;
  }

  async setPayment(paymentId: string, data: any, ttl = 3600) {
    await this.redis.setex(
      `payment:${paymentId}`,
      ttl,
      JSON.stringify(data)
    );
  }

  async invalidatePayment(paymentId: string) {
    await this.redis.del(`payment:${paymentId}`);
  }
}
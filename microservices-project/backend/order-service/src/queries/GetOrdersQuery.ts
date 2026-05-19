import { Order } from '../models/Order';
import { OrderCacheService } from '../cache/OrderCacheService';

export class GetOrdersQuery {
  private cache = new OrderCacheService();

  // Corrigido: Retorna uma lista de pedidos -> Promise<Order[]>
  async findAll(): Promise<Order[]> {
    // lista completa nao e cacheada (muda a cada pedido criado)
    return await Order.findAll({ order: [['createdAt', 'DESC']] });
  }

  // Corrigido: Retorna um pedido específico ou null se não encontrar -> Promise<Order | null>
  async findById(id: string): Promise<Order | null> {
    const cached = await this.cache.getOrder(id);
    if (cached) return cached as Order;
    
    const order = await Order.findByPk(id);
    if (!order) return null;
    
    await this.cache.setOrder(order.toJSON());
    return order;
  }

  // Corrigido: Retorna uma lista de pedidos filtrada -> Promise<Order[]>
  async findByUser(userId: string): Promise<Order[]> {
    return await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  }
}
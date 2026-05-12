import { Order } from '../models/Order';

/**
 * CQRS - QUERY: Responsável apenas por LER dados.
 * Não modifica nenhum estado. Pode ser otimizada com cache ou read replica.
 */
export class GetOrdersQuery {
  async findAll(): Promise<Order[]> {
    return await Order.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findById(id: string): Promise<Order | null> {
    return await Order.findByPk(id);
  }

  async findByUser(userId: string): Promise<Order[]> {
    return await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }
}

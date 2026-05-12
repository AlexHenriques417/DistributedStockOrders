import { Order } from '../models/Order';

/**
 * CQRS - COMMAND: Responsável apenas por ATUALIZAR o status do pedido.
 * Acionado pelo consumer de eventos payment.approved / payment.refused.
 */
export class UpdateOrderStatusCommand {
  async execute(orderId: string, status: 'PENDING' | 'PAID' | 'CANCELED'): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.warn(`[COMMAND] Pedido não encontrado para atualizar: ${orderId}`);
      return null;
    }

    order.status = status;
    await order.save();
    console.log(`[COMMAND] Pedido ${orderId} atualizado para status: ${status}`);
    return order;
  }
}

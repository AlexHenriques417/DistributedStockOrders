import { Order } from '../models/Order';
import { OrderCacheService } from '../cache/OrderCacheService';
import { OrderGateway } from '../gateway/OrderGateway';

// Invalida cache E notifica WebSocket na mesma operacao.
// Sequencia: banco -> cache -> websocket (nessa ordem, sem inverter)
export class UpdateOrderStatusCommand {
  private cache = new OrderCacheService();

  constructor(private gateway: OrderGateway | null = null) {}

  // Corrigido: Definido que a Promise retorna a instância da Order atualizada ou null
  async execute(orderId: string, status: 'PENDING' | 'PAID' | 'CANCELED'): Promise<Order | null> {
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.warn(`[COMMAND] Pedido nao encontrado: ${orderId}`);
      return null;
    }
    
    // 1. banco
    order.status = status;
    await order.save();
    console.log(`[COMMAND] Pedido ${orderId} -> ${status}`);
    
    // 2. cache (APOS commit)
    await this.cache.invalidate(orderId);
    
    // 3. WebSocket em tempo real
    if (this.gateway) {
      this.gateway.notifyOrderStatusUpdated(orderId, status);
    }
    
    return order;
  }
}
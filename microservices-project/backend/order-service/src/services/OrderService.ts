import { CreateOrderCommand, CreateOrderInput } from '../commands/CreateOrderCommand';
import { UpdateOrderStatusCommand } from '../commands/UpdateOrderStatusCommand';
import { GetOrdersQuery } from '../queries/GetOrdersQuery';

/**
 * OrderService agora é apenas um ORQUESTRADOR de Commands e Queries (CQRS).
 * - Operações de escrita → Commands
 * - Operações de leitura → Queries
 */
export class OrderService {
  private createOrderCommand    = new CreateOrderCommand();
  private updateStatusCommand   = new UpdateOrderStatusCommand();
  private getOrdersQuery        = new GetOrdersQuery();

  // ---- QUERIES (leitura) ----
  async findAll() {
    return this.getOrdersQuery.findAll();
  }

  async findById(id: string) {
    return this.getOrdersQuery.findById(id);
  }

  async findByUser(userId: string) {
    return this.getOrdersQuery.findByUser(userId);
  }

  // ---- COMMANDS (escrita) ----
  async createOrder(data: CreateOrderInput) {
    return this.createOrderCommand.execute(data);
  }

  async updateStatus(id: string, status: 'PENDING' | 'PAID' | 'CANCELED') {
    return this.updateStatusCommand.execute(id, status);
  }
}

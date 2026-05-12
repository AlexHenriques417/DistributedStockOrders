import { ProcessPaymentCommand, ProcessPaymentInput } from '../commands/ProcessPaymentCommand';
import { GetPaymentsQuery } from '../queries/GetPaymentsQuery';

export class PaymentService {
  private processPaymentCommand = new ProcessPaymentCommand();
  private getPaymentsQuery      = new GetPaymentsQuery();

  // COMMANDS
  async processPayment(data: ProcessPaymentInput) {
    return this.processPaymentCommand.execute(data);
  }

  // QUERIES
  async findByOrderId(orderId: string) {
    return this.getPaymentsQuery.findByOrderId(orderId);
  }

  async findAll() {
    return this.getPaymentsQuery.findAll();
  }
}

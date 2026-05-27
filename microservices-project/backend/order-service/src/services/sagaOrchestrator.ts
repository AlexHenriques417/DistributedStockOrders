import { PrismaClient, Decimal } from '@prisma/client';
import connect from 'amqplib';
import { prisma } from '../server';
import { publishEvent, publishToPaymentService, publishToInventoryService } from '../config/rabbitmq';
import { OrderStatus } from './orderService';

// Saga step types
export enum SagaStep {
  INIT = 'init',
  RESERVE_INVENTORY = 'reserve_inventory',
  PROCESS_PAYMENT = 'process_payment',
  CONFIRM_ORDER = 'confirm_order',
  COMPLETE = 'complete',
  // Compensation steps
  RELEASE_INVENTORY = 'release_inventory',
  REFUND_PAYMENT = 'refund_payment',
  CANCEL_ORDER = 'cancel_order',
}

// Saga status
export enum SagaStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

interface SagaStepResult {
  step: SagaStep;
  status: 'success' | 'failed';
  data?: any;
  error?: string;
}

interface PaymentCompletedEvent {
  orderId: string;
  paymentId: string;
  amount: number;
  status: 'completed' | 'failed';
}

interface InventoryReservedEvent {
  orderId: string;
  reservationId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

class SagaOrchestrator {
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.retryAttempts = parseInt(process.env.SAGA_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.SAGA_RETRY_DELAY || '5000');
  }

  // Start a new saga for order processing
  async startOrderSaga(orderId: string, channel: connect.Channel) {
    // Create initial saga state
    const sagaState = await prisma.orderSagaState.create({
      data: {
        orderId,
        currentStep: SagaStep.INIT,
        status: SagaStatus.IN_PROGRESS,
        steps: {
          completed: [],
          pending: [
            SagaStep.RESERVE_INVENTORY,
            SagaStep.PROCESS_PAYMENT,
            SagaStep.CONFIRM_ORDER,
            SagaStep.COMPLETE,
          ],
        },
        compensation: [],
      },
    });

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      await this.failSaga(sagaState.id, 'Order not found');
      return;
    }

    // Start the saga by reserving inventory
    await this.executeReserveInventory(sagaState, order, channel);
  }

  // Step 1: Reserve inventory
  private async executeReserveInventory(
    sagaState: any,
    order: any,
    channel: connect.Channel
  ) {
    try {
      await this.updateSagaStep(sagaState.id, SagaStep.RESERVE_INVENTORY);

      // Publish inventory reservation request
      await publishToInventoryService(channel, 'inventory.reserve', {
        orderId: order.id,
        items: order.orderItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        timestamp: new Date().toISOString(),
      });

      // Store compensation action
      await this.addCompensationAction(sagaState.id, {
        step: SagaStep.RELEASE_INVENTORY,
        data: { orderId: order.id, items: order.orderItems },
      });
    } catch (error) {
      await this.handleError(sagaState.id, error, SagaStep.RESERVE_INVENTORY, channel);
    }
  }

  // Handle inventory reserved event
  async handleInventoryReserved(data: InventoryReservedEvent) {
    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (!sagaState) {
      console.error(`Saga state not found for order ${data.orderId}`);
      return;
    }

    // Mark step as completed
    await this.completeStep(sagaState.id, SagaStep.RESERVE_INVENTORY, data);

    // Move to next step: process payment
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (order) {
      await this.executeProcessPayment(sagaState, order);
    }
  }

  // Handle inventory reservation failed
  async handleInventoryReservationFailed(data: { orderId: string; error: string }) {
    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (!sagaState) {
      console.error(`Saga state not found for order ${data.orderId}`);
      return;
    }

    // Start compensation
    const channel = (global as any).rabbitmqChannel;
    await this.compensate(sagaState, data.error, channel);
  }

  // Step 2: Process payment
  private async executeProcessPayment(sagaState: any, order: any) {
    const channel = (global as any).rabbitmqChannel;

    try {
      await this.updateSagaStep(sagaState.id, SagaStep.PROCESS_PAYMENT);

      // Publish payment request
      await publishToPaymentService(channel, 'payment.process', {
        orderId: order.id,
        amount: order.finalAmount.toString(),
        paymentMethod: order.paymentMethod,
        userId: order.userId,
        timestamp: new Date().toISOString(),
      });

      // Store compensation action
      await this.addCompensationAction(sagaState.id, {
        step: SagaStep.REFUND_PAYMENT,
        data: { orderId: order.id, amount: order.finalAmount },
      });
    } catch (error) {
      await this.handleError(sagaState.id, error, SagaStep.PROCESS_PAYMENT, channel);
    }
  }

  // Handle payment completed event
  async handlePaymentCompleted(data: PaymentCompletedEvent) {
    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (!sagaState) {
      console.error(`Saga state not found for order ${data.orderId}`);
      return;
    }

    // Update order with payment ID
    await prisma.order.update({
      where: { id: data.orderId },
      data: { paymentId: data.paymentId },
    });

    // Mark step as completed
    await this.completeStep(sagaState.id, SagaStep.PROCESS_PAYMENT, data);

    // Move to next step: confirm order
    await this.executeConfirmOrder(sagaState, data.orderId);
  }

  // Handle payment failed
  async handlePaymentFailed(data: { orderId: string; error: string }) {
    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (!sagaState) {
      console.error(`Saga state not found for order ${data.orderId}`);
      return;
    }

    // Start compensation
    const channel = (global as any).rabbitmqChannel;
    await this.compensate(sagaState, data.error, channel);
  }

  // Handle payment refunded
  async handlePaymentRefunded(data: { orderId: string; refundId: string }) {
    console.log(`Payment refunded for order ${data.orderId}`);

    // Update saga state if exists
    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (sagaState) {
      await this.completeStep(sagaState.id, SagaStep.REFUND_PAYMENT, data);
    }
  }

  // Step 3: Confirm order
  private async executeConfirmOrder(sagaState: any, orderId: string) {
    const channel = (global as any).rabbitmqChannel;

    try {
      await this.updateSagaStep(sagaState.id, SagaStep.CONFIRM_ORDER);

      // Update order status to confirmed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      // Publish order confirmed event
      await publishEvent(channel, 'order.confirmed', {
        orderId,
        timestamp: new Date().toISOString(),
      });

      // Mark step as completed
      await this.completeStep(sagaState.id, SagaStep.CONFIRM_ORDER, { orderId });

      // Move to complete
      await this.completeSaga(sagaState.id, orderId, channel);
    } catch (error) {
      await this.handleError(sagaState.id, error, SagaStep.CONFIRM_ORDER, channel);
    }
  }

  // Handle inventory released
  async handleInventoryReleased(data: { orderId: string }) {
    console.log(`Inventory released for order ${data.orderId}`);

    const sagaState = await prisma.orderSagaState.findFirst({
      where: { orderId: data.orderId },
    });

    if (sagaState) {
      await this.completeStep(sagaState.id, SagaStep.RELEASE_INVENTORY, data);

      // Check if all compensation is done
      await this.checkCompensationComplete(sagaState.id);
    }
  }

  // Compensation logic
  private async compensate(sagaState: any, error: string, channel: connect.Channel) {
    await this.updateSagaStatus(sagaState.id, SagaStatus.COMPENSATING);

    // Update order status to cancelled
    await prisma.order.update({
      where: { id: sagaState.orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Execute compensation actions in reverse order
    const compensationActions = sagaState.compensation as any[] || [];
    const reversedActions = [...compensationActions].reverse();

    for (const action of reversedActions) {
      try {
        if (action.step === SagaStep.RELEASE_INVENTORY) {
          await publishToInventoryService(channel, 'inventory.release', {
            orderId: action.data.orderId,
            items: action.data.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          });
        } else if (action.step === SagaStep.REFUND_PAYMENT) {
          await publishToPaymentService(channel, 'payment.refund', {
            orderId: action.data.orderId,
            amount: action.data.amount.toString(),
          });
        }
      } catch (compensationError) {
        console.error(`Compensation failed for step ${action.step}:`, compensationError);
      }
    }

    // Mark saga as compensated
    await this.updateSagaStatus(sagaState.id, SagaStatus.COMPENSATED);

    // Publish order cancelled event
    await publishEvent(channel, 'order.cancelled', {
      orderId: sagaState.orderId,
      reason: error,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper methods
  private async updateSagaStep(sagaStateId: string, step: SagaStep) {
    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: {
        currentStep: step,
        updatedAt: new Date(),
      },
    });
  }

  private async updateSagaStatus(sagaStateId: string, status: SagaStatus) {
    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === SagaStatus.COMPLETED || status === SagaStatus.COMPENSATED
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  private async completeStep(
    sagaStateId: string,
    step: SagaStep,
    result: any
  ) {
    const sagaState = await prisma.orderSagaState.findUnique({
      where: { id: sagaStateId },
    });

    if (!sagaState) return;

    const steps = sagaState.steps as any;
    steps.completed.push({ step, result, timestamp: new Date().toISOString() });

    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: {
        steps,
        updatedAt: new Date(),
      },
    });
  }

  private async addCompensationAction(sagaStateId: string, action: any) {
    const sagaState = await prisma.orderSagaState.findUnique({
      where: { id: sagaStateId },
    });

    if (!sagaState) return;

    const compensation = sagaState.compensation as any[] || [];
    compensation.push(action);

    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: { compensation },
    });
  }

  private async handleError(
    sagaStateId: string,
    error: any,
    step: SagaStep,
    channel: connect.Channel
  ) {
    const sagaState = await prisma.orderSagaState.findUnique({
      where: { id: sagaStateId },
    });

    if (!sagaState) return;

    // Record error
    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: {
        errorMessage: error.message || String(error),
        retryCount: { increment: 1 },
      },
    });

    // Check if should retry
    if (sagaState.retryCount < this.retryAttempts) {
      console.log(`Retrying step ${step} (attempt ${sagaState.retryCount + 1}/${this.retryAttempts})`);
      // Will retry after delay
      setTimeout(() => {
        this.retryStep(sagaStateId, step, channel);
      }, this.retryDelay);
    } else {
      // Max retries exceeded, start compensation
      await this.compensate(
        { ...sagaState, orderId: sagaState.orderId },
        error.message,
        channel
      );
    }
  }

  private async retryStep(
    sagaStateId: string,
    step: SagaStep,
    channel: connect.Channel
  ) {
    const sagaState = await prisma.orderSagaState.findUnique({
      where: { id: sagaStateId },
    });

    if (!sagaState) return;

    const order = await prisma.order.findUnique({
      where: { id: sagaState.orderId },
      include: { orderItems: true },
    });

    if (!order) return;

    switch (step) {
      case SagaStep.RESERVE_INVENTORY:
        await this.executeReserveInventory(sagaState, order, channel);
        break;
      case SagaStep.PROCESS_PAYMENT:
        await this.executeProcessPayment(sagaState, order);
        break;
      case SagaStep.CONFIRM_ORDER:
        await this.executeConfirmOrder(sagaState, order.id);
        break;
    }
  }

  private async failSaga(sagaStateId: string, error: string) {
    await prisma.orderSagaState.update({
      where: { id: sagaStateId },
      data: {
        status: SagaStatus.FAILED,
        errorMessage: error,
        updatedAt: new Date(),
      },
    });
  }

  private async completeSaga(
    sagaStateId: string,
    orderId: string,
    channel: connect.Channel
  ) {
    await this.updateSagaStep(sagaStateId, SagaStep.COMPLETE);
    await this.updateSagaStatus(sagaStateId, SagaStatus.COMPLETED);

    // Publish order completed event
    await publishEvent(channel, 'order.completed', {
      orderId,
      timestamp: new Date().toISOString(),
    });
  }

  private async checkCompensationComplete(sagaStateId: string) {
    const sagaState = await prisma.orderSagaState.findUnique({
      where: { id: sagaStateId },
    });

    if (!sagaState) return;

    const steps = sagaState.steps as any;
    const compensation = sagaState.compensation as any[];

    // Check if all compensation steps are complete
    const completedCompensations = steps.completed.filter((s: any) =>
      [SagaStep.RELEASE_INVENTORY, SagaStep.REFUND_PAYMENT].includes(s.step)
    );

    if (completedCompensations.length === compensation.length) {
      await this.updateSagaStatus(sagaStateId, SagaStatus.COMPENSATED);
    }
  }

  // Get saga state by order ID
  async getSagaState(orderId: string) {
    return prisma.orderSagaState.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const sagaOrchestrator = new SagaOrchestrator();
export default sagaOrchestrator;

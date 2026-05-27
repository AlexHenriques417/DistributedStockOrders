import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { publishEvent } from '../config/rabbitmq';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { ProcessPaymentDto, RefundPaymentDto } from '../dtos/payment.dto';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Process a payment (mock/simulation)
   */
  async processPayment(data: ProcessPaymentDto, channel: any) {
    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findFirst({
      where: { orderId: data.orderId },
    });

    if (existingPayment) {
      throw new ApiError(StatusCodes.CONFLICT, 'Payment already exists for this order');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'BRL',
        status: PaymentStatus.PROCESSING,
        paymentMethod: data.paymentMethod as PaymentMethod,
        description: data.description,
        metadata: data.metadata || {},
      },
    });

    // Create transaction record
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        transactionType: 'PAYMENT',
        amount: data.amount,
        status: 'PROCESSING',
        gatewayTxId: `mock_${uuidv4()}`,
      },
    });

    // Simulate payment processing
    const processedPayment = await this.simulatePaymentProcessing(payment.id, data, channel);

    return processedPayment;
  }

  /**
   * Simulate payment processing (mock implementation)
   */
  private async simulatePaymentProcessing(
    paymentId: string,
    data: ProcessPaymentDto,
    channel: any
  ) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate success (90% success rate for mock)
    const isSuccess = Math.random() < 0.9;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (isSuccess) {
      // Update payment status to completed
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Update transaction
      await prisma.paymentTransaction.updateMany({
        where: { paymentId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: { success: true, message: 'Payment processed successfully' },
        },
      });

      // Store payment method details
      await this.storePaymentMethodDetails(paymentId, data);

      // Publish payment.completed event
      await publishEvent(channel, 'payment.completed', {
        paymentId,
        orderId: updatedPayment.orderId,
        userId: updatedPayment.userId,
        amount: Number(updatedPayment.amount),
        currency: updatedPayment.currency,
        paymentMethod: updatedPayment.paymentMethod,
        timestamp: new Date().toISOString(),
      });

      return updatedPayment;
    } else {
      // Update payment status to failed
      const errorMessage = this.getMockFailureReason(data.paymentMethod);
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          processedAt: new Date(),
        },
      });

      // Update transaction
      await prisma.paymentTransaction.updateMany({
        where: { paymentId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          gatewayResponse: { success: false, message: errorMessage },
        },
      });

      // Publish payment.failed event
      await publishEvent(channel, 'payment.failed', {
        paymentId,
        orderId: updatedPayment.orderId,
        userId: updatedPayment.userId,
        amount: Number(updatedPayment.amount),
        errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw new ApiError(StatusCodes.PAYMENT_REQUIRED, `Payment failed: ${errorMessage}`);
    }
  }

  /**
   * Store payment method details (mock)
   */
  private async storePaymentMethodDetails(paymentId: string, data: ProcessPaymentDto) {
    const methodDetails: any = {
      paymentId,
      methodType: data.paymentMethod,
    };

    switch (data.paymentMethod) {
      case 'CREDIT_CARD':
        // Store masked card details
        methodDetails.cardLastFour = '4242';
        methodDetails.cardBrand = 'VISA';
        methodDetails.cardExpiryMonth = 12;
        methodDetails.cardExpiryYear = 2025;
        methodDetails.cardholderName = 'Mock User';
        break;
      case 'PIX':
        methodDetails.pixKey = `pix_${uuidv4()}`;
        break;
      case 'BOLETEO':
        methodDetails.boletoBarcode = this.generateMockBoletoBarcode();
        methodDetails.boletoDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        break;
    }

    await prisma.userPaymentMethod.create({
      data: methodDetails,
    });
  }

  /**
   * Generate mock boleto barcode
   */
  private generateMockBoletoBarcode(): string {
    const digits = Array.from({ length: 47 }, () => Math.floor(Math.random() * 10)).join('');
    return digits;
  }

  /**
   * Get mock failure reason based on payment method
   */
  private getMockFailureReason(method: string): string {
    const reasons: Record<string, string[]> = {
      CREDIT_CARD: ['Insufficient funds', 'Card declined', 'Invalid card number', 'Expired card'],
      PIX: ['PIX limit exceeded', 'Invalid PIX key', 'Bank unavailable'],
      BOLETO: ['Boleto generation failed', 'Invalid document number'],
    };
    const methodReasons = reasons[method] || ['Unknown error'];
    return methodReasons[Math.floor(Math.random() * methodReasons.length)];
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        transactions: true,
        paymentMethodDetails: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    return payment;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string) {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        transactions: true,
        paymentMethodDetails: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found for this order');
    }

    return payment;
  }

  /**
   * List payments with filters
   */
  async listPayments(filters: { orderId?: string; userId?: string; status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          transactions: true,
          paymentMethodDetails: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process a refund
   */
  async processRefund(data: RefundPaymentDto, channel: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { refunds: true },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Only completed payments can be refunded');
    }

    // Calculate total already refunded
    const totalRefunded = payment.refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (data.amount + totalRefunded > Number(payment.amount)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Refund amount exceeds available balance');
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason,
        status: 'PROCESSING',
      },
    });

    // Create refund transaction
    await prisma.paymentTransaction.create({
      data: {
        paymentId: data.paymentId,
        transactionType: 'REFUND',
        amount: data.amount,
        status: 'PROCESSING',
        gatewayTxId: `refund_${uuidv4()}`,
      },
    });

    // Simulate refund processing
    const processedRefund = await this.simulateRefundProcessing(refund.id, payment, channel);

    return processedRefund;
  }

  /**
   * Simulate refund processing (mock implementation)
   */
  private async simulateRefundProcessing(refundId: string, payment: any, channel: any) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate success (95% success rate for refunds)
    const isSuccess = Math.random() < 0.95;

    if (isSuccess) {
      const updatedRefund = await prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayRefundId: `gw_refund_${uuidv4()}`,
        },
      });

      // Update transaction
      await prisma.paymentTransaction.updateMany({
        where: { paymentId: payment.id, transactionType: 'REFUND' },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: { success: true, message: 'Refund processed successfully' },
        },
      });

      // Check if full refund
      const allRefunds = await prisma.refund.findMany({
        where: { paymentId: payment.id, status: 'COMPLETED' },
      });
      const totalRefunded = allRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

      if (totalRefunded >= Number(payment.amount)) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }

      // Publish payment.refunded event
      await publishEvent(channel, 'payment.refunded', {
        refundId,
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: Number(updatedRefund.amount),
        reason: updatedRefund.reason,
        timestamp: new Date().toISOString(),
      });

      return updatedRefund;
    } else {
      await prisma.refund.update({
        where: { id: refundId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
        },
      });

      await prisma.paymentTransaction.updateMany({
        where: { paymentId: payment.id, transactionType: 'REFUND' },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          gatewayResponse: { success: false, message: 'Refund failed' },
        },
      });

      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Refund processing failed');
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string, channel: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Only pending or processing payments can be cancelled');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    // Publish payment.cancelled event
    await publishEvent(channel, 'payment.cancelled', {
      paymentId,
      orderId: updatedPayment.orderId,
      userId: updatedPayment.userId,
      timestamp: new Date().toISOString(),
    });

    return updatedPayment;
  }

  /**
   * Get payment transactions
   */
  async getPaymentTransactions(paymentId: string) {
    const transactions = await prisma.paymentTransaction.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }

  /**
   * Handle order created event (for automatic payment processing)
   */
  async handleOrderCreated(orderData: any, channel: any) {
    console.log('Processing payment for order:', orderData.orderId);

    // Create a pending payment for the order
    const payment = await prisma.payment.create({
      data: {
        orderId: orderData.orderId,
        userId: orderData.userId,
        amount: orderData.total,
        currency: 'BRL',
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD, // Default
        description: `Payment for order ${orderData.orderId}`,
        metadata: orderData,
      },
    });

    return payment;
  }

  /**
   * Handle order confirmed event
   */
  async handleOrderConfirmed(orderData: any, channel: any) {
    console.log('Order confirmed, updating payment:', orderData.orderId);

    const payment = await prisma.payment.findFirst({
      where: { orderId: orderData.orderId },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
      // Auto-process payment when order is confirmed
      await this.processPayment({
        orderId: orderData.orderId,
        userId: payment.userId,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod as PaymentMethod,
      }, channel);
    }
  }
}

export default new PaymentService();

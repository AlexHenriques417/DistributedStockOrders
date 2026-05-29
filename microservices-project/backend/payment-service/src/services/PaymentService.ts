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
    const existingPayment = await prisma.payment.findFirst({
      where: { orderId: data.orderId },
    });

    if (existingPayment) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Payment already exists for this order'
      );
    }

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

    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        transactionType: 'PAYMENT',
        amount: data.amount,
        status: 'PROCESSING',
        gatewayTxId: `mock_${uuidv4()}`,
      },
    });

    const processedPayment = await this.simulatePaymentProcessing(
      payment.id,
      data,
      channel
    );

    return processedPayment;
  }

  /**
   * Simulate payment processing
   */
  private async simulatePaymentProcessing(
    paymentId: string,
    data: ProcessPaymentDto,
    channel: any
  ) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const isSuccess = Math.random() < 0.9;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (isSuccess) {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await prisma.paymentTransaction.updateMany({
        where: { paymentId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: {
            success: true,
            message: 'Payment processed successfully',
          },
        },
      });

      await this.storePaymentMethodDetails(paymentId, data);

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
    }

    const errorMessage = this.getMockFailureReason(data.paymentMethod);

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        processedAt: new Date(),
      },
    });

    await prisma.paymentTransaction.updateMany({
      where: { paymentId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        gatewayResponse: {
          success: false,
          message: errorMessage,
        },
      },
    });

    await publishEvent(channel, 'payment.failed', {
      paymentId,
      orderId: updatedPayment.orderId,
      userId: updatedPayment.userId,
      amount: Number(updatedPayment.amount),
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    throw new ApiError(
      StatusCodes.PAYMENT_REQUIRED,
      `Payment failed: ${errorMessage}`
    );
  }

  /**
   * Store payment method details
   */
  private async storePaymentMethodDetails(
    paymentId: string,
    data: ProcessPaymentDto
  ) {
    try {
      const methodDetails: any = {
        paymentId,
        methodType: data.paymentMethod as PaymentMethod,
      };

      // Normalizar o método de pagamento para uppercase
      const paymentMethod = String(data.paymentMethod).toUpperCase();

      switch (paymentMethod) {
        case 'CREDIT_CARD':
          methodDetails.cardLastFour = '4242';
          methodDetails.cardBrand = 'VISA';
          methodDetails.cardExpiryMonth = 12;
          methodDetails.cardExpiryYear = 2025;
          methodDetails.cardholderName = 'Mock User';
          break;

        case 'PIX':
          methodDetails.pixKey = `pix_${uuidv4()}`;
          break;

        case 'BOLETO':
          methodDetails.boletoBarcode = this.generateMockBoletoBarcode();
          methodDetails.boletoDueDate = new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          );
          break;

        default:
          console.log(`No specific details for payment method: ${paymentMethod}`);
          return; // Não cria registro se não houver detalhes específicos
      }

      await prisma.userPaymentMethod.create({
        data: methodDetails,
      });
    } catch (error) {
      console.error('Error storing payment method details:', error);
      // Não lança erro para não interromper o fluxo de pagamento
    }
  }

  /**
   * Generate boleto barcode
   */
  private generateMockBoletoBarcode(): string {
    return Array.from(
      { length: 47 },
      () => Math.floor(Math.random() * 10)
    ).join('');
  }

  /**
   * Mock failure reasons
   */
  private getMockFailureReason(method: string): string {
    const reasons: Record<string, string[]> = {
      CREDIT_CARD: [
        'Insufficient funds',
        'Card declined',
        'Invalid card number',
        'Expired card',
      ],
      PIX: [
        'PIX limit exceeded',
        'Invalid PIX key',
        'Bank unavailable',
      ],
      BOLETO: [
        'Boleto generation failed',
        'Invalid document number',
      ],
    };

    // Normalizar o método para uppercase
    const normalizedMethod = String(method).toUpperCase();
    const methodReasons = reasons[normalizedMethod] || ['Unknown error'];

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
        refunds: true,
      },
    });

    if (!payment) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Payment not found for this order'
      );
    }

    return payment;
  }

  /**
   * List payments
   */
  async listPayments(filters: {
    orderId?: string;
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
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
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
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
   * Process refund
   */
  async processRefund(data: RefundPaymentDto, channel: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { refunds: true },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED && 
        payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Only completed or partially refunded payments can be refunded'
      );
    }

    const totalRefunded = payment.refunds
      .filter((r: any) => r.status === 'COMPLETED')
      .reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    if (data.amount + totalRefunded > Number(payment.amount)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Refund amount exceeds available balance'
      );
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason,
        status: 'PROCESSING',
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        paymentId: data.paymentId,
        transactionType: 'REFUND',
        amount: data.amount,
        status: 'PROCESSING',
        gatewayTxId: `refund_${uuidv4()}`,
      },
    });

    return this.simulateRefundProcessing(refund.id, payment, channel);
  }

  /**
   * Simulate refund processing
   */
  private async simulateRefundProcessing(
    refundId: string,
    payment: any,
    channel: any
  ) {
    await new Promise((resolve) => setTimeout(resolve, 300));

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

      await prisma.paymentTransaction.updateMany({
        where: {
          paymentId: payment.id,
          transactionType: 'REFUND',
          status: 'PROCESSING',
        },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          gatewayResponse: {
            success: true,
            message: 'Refund processed successfully',
          },
        },
      });

      const allRefunds = await prisma.refund.findMany({
        where: {
          paymentId: payment.id,
          status: 'COMPLETED',
        },
      });

      const totalRefunded = allRefunds.reduce(
        (sum: number, r: any) => sum + Number(r.amount),
        0
      );

      // Atualizar status do pagamento baseado no total reembolsado
      if (totalRefunded >= Number(payment.amount)) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
          },
        });
      } else if (totalRefunded > 0) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PARTIALLY_REFUNDED,
          },
        });
      }

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
    }

    await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
      },
    });

    await prisma.paymentTransaction.updateMany({
      where: {
        paymentId: payment.id,
        transactionType: 'REFUND',
        status: 'PROCESSING',
      },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        gatewayResponse: {
          success: false,
          message: 'Refund processing failed',
        },
      },
    });

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Refund processing failed'
    );
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, channel: any) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Only pending or processing payments can be cancelled'
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    // Atualizar transações relacionadas
    await prisma.paymentTransaction.updateMany({
      where: {
        paymentId,
        status: 'PROCESSING',
      },
      data: {
        status: 'CANCELLED',
        processedAt: new Date(),
        gatewayResponse: {
          success: false,
          message: 'Payment cancelled',
        },
      },
    });

    await publishEvent(channel, 'payment.cancelled', {
      paymentId,
      orderId: updatedPayment.orderId,
      userId: updatedPayment.userId,
      timestamp: new Date().toISOString(),
    });

    return updatedPayment;
  }

  /**
   * Get transactions
   */
  async getPaymentTransactions(paymentId: string) {
    return prisma.paymentTransaction.findMany({
      where: { paymentId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Handle order created - CORRIGIDO: apenas 1 parâmetro
   */
  async handleOrderCreated(orderData: any) {
    console.log('Creating payment for order:', orderData.orderId);

    const paymentMethod = orderData.paymentMethod || 'CREDIT_CARD';

    const payment = await prisma.payment.create({
      data: {
        orderId: orderData.orderId,
        userId: orderData.userId,
        amount: orderData.total || orderData.amount || 0,
        currency: orderData.currency || 'BRL',
        status: PaymentStatus.PENDING,
        paymentMethod: paymentMethod as PaymentMethod,
        description: `Payment for order ${orderData.orderId}`,
        metadata: orderData,
      },
    });

    // Criar transação inicial
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        transactionType: 'PAYMENT',
        amount: payment.amount,
        status: 'PENDING',
        gatewayTxId: `pending_${uuidv4()}`,
      },
    });

    console.log(`Payment created for order ${orderData.orderId}:`, payment.id);

    return payment;
  }

  /**
   * Handle order confirmed
   */
  async handleOrderConfirmed(orderData: any, channel: any) {
    console.log('Order confirmed, processing payment:', orderData.orderId);

    const payment = await prisma.payment.findFirst({
      where: {
        orderId: orderData.orderId,
        status: PaymentStatus.PENDING,
      },
    });

    if (payment) {
      console.log(`Processing payment ${payment.id} for order ${orderData.orderId}`);
      
      return this.processPayment(
        {
          orderId: orderData.orderId,
          userId: payment.userId,
          amount: Number(payment.amount),
          currency: payment.currency,
          paymentMethod: payment.paymentMethod as any,
          description: payment.description || undefined,
          metadata: payment.metadata as any,
        },
        channel
      );
    }

    console.log(`No pending payment found for order ${orderData.orderId}`);
    return null;
  }
}

export default new PaymentService();
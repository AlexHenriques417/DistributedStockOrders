import { PrismaClient, Decimal } from '@prisma/client';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto, AddToCartDto, UpdateCartItemDto, ValidateCouponDto, OrderQueryDto } from '../dtos/order.dto';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { publishEvent } from '../config/rabbitmq';
import connect from 'amqplib';
import { prisma } from '../server';

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export class OrderService {
  // Order Operations
  async createOrder(userId: string, data: CreateOrderDto, channel: connect.Channel) {
    // Calculate totals
    let totalAmount = new Decimal(0);
    const orderItems = data.items.map(item => {
      const totalPrice = new Decimal(item.unitPrice).mul(item.quantity);
      totalAmount = totalAmount.add(totalPrice);
      return {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: new Decimal(item.unitPrice),
        totalPrice,
      };
    });

    // Apply coupon if provided
    let discountAmount = new Decimal(0);
    let couponId = null;
    if (data.couponCode) {
      const couponResult = await this.validateCoupon({
        code: data.couponCode,
        orderAmount: totalAmount.toNumber(),
      });
      discountAmount = new Decimal(couponResult.discountAmount);
      couponId = couponResult.couponId;
    }

    const finalAmount = totalAmount.sub(discountAmount);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        totalAmount,
        discountAmount,
        finalAmount,
        shippingAddress: data.shippingAddress as any,
        billingAddress: (data.billingAddress || data.shippingAddress) as any,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Create coupon redemption if applicable
    if (couponId) {
      await prisma.couponRedemption.create({
        data: {
          couponId,
          orderId: order.id,
          userId,
          discountApplied: discountAmount,
        },
      });

      // Increment coupon usage
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Publish order created event
    await publishEvent(channel, 'order.created', {
      orderId: order.id,
      userId,
      totalAmount: totalAmount.toString(),
      finalAmount: finalAmount.toString(),
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
      shippingAddress: data.shippingAddress,
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        couponRedemptions: {
          include: {
            coupon: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
    }

    // If userId is provided, verify ownership
    if (userId && order.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied to this order');
    }

    return order;
  }

  async getOrdersByUser(userId: string, query: OrderQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusDto, channel: connect.Channel) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
    }

    // Validate status transition
    const validNextStatuses = validTransitions[order.status] || [];
    if (!validNextStatuses.includes(data.status)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot transition from ${order.status} to ${data.status}`
      );
    }

    const updateData: any = {
      status: data.status,
      updatedAt: new Date(),
    };

    // Set timestamps for specific statuses
    switch (data.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmedAt = new Date();
        break;
      case OrderStatus.SHIPPED:
        updateData.shippedAt = new Date();
        if (data.trackingNumber) {
          updateData.trackingNumber = data.trackingNumber;
        }
        break;
      case OrderStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelledAt = new Date();
        break;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Publish event based on status
    const eventRoutingKey = `order.${data.status}`;
    await publishEvent(channel, eventRoutingKey, {
      orderId,
      status: data.status,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, data: CancelOrderDto, channel: connect.Channel) {
    const order = await this.getOrderById(orderId, userId);

    // Can only cancel pending or confirmed orders
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status as OrderStatus)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Cannot cancel order in ${order.status} status`
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        notes: data.reason,
      },
    });

    // Publish order cancelled event
    await publishEvent(channel, 'order.cancelled', {
      orderId,
      userId,
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });

    return updatedOrder;
  }

  // Shopping Cart Operations
  async getOrCreateCart(userId: string) {
    let cart = await prisma.shoppingCart.findUnique({
      where: { userId },
      include: {
        cartItems: true,
      },
    });

    if (!cart) {
      cart = await prisma.shoppingCart.create({
        data: { userId },
        include: {
          cartItems: true,
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, data: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
      },
    });

    if (existingItem) {
      // Update quantity
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity,
          unitPrice: new Decimal(data.unitPrice),
          updatedAt: new Date(),
        },
      });
    }

    // Create new item
    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        productName: data.productName,
        productSku: data.productSku,
        quantity: data.quantity,
        unitPrice: new Decimal(data.unitPrice),
      },
    });
  }

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Cart item not found');
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: data.quantity,
        updatedAt: new Date(),
      },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Cart item not found');
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared' };
  }

  async getCartSummary(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    let subtotal = new Decimal(0);
    const items = cart.cartItems.map(item => {
      const itemTotal = item.unitPrice.mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      return {
        ...item,
        itemTotal: itemTotal.toString(),
      };
    });

    return {
      cartId: cart.id,
      items,
      subtotal: subtotal.toString(),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  // Coupon Operations
  async validateCoupon(data: ValidateCouponDto) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (!coupon) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }

    if (!coupon.isActive) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon is not active');
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon has expired');
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Coupon usage limit reached');
    }

    if (coupon.minOrderAmount && new Decimal(data.orderAmount).lt(coupon.minOrderAmount)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Minimum order amount is ${coupon.minOrderAmount}`
      );
    }

    // Calculate discount
    let discountAmount: Decimal;
    if (coupon.discountType === 'percentage') {
      discountAmount = new Decimal(data.orderAmount).mul(coupon.discountValue).div(100);
    } else {
      discountAmount = coupon.discountValue;

      // Ensure discount doesn't exceed order amount
      if (discountAmount.gt(data.orderAmount)) {
        discountAmount = new Decimal(data.orderAmount);
      }
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: discountAmount.toString(),
      message: 'Coupon is valid',
    };
  }

  async createCoupon(data: any) {
    return prisma.coupon.create({
      data: {
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: new Decimal(data.discountValue),
        minOrderAmount: data.minOrderAmount ? new Decimal(data.minOrderAmount) : null,
        maxUses: data.maxUses,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
      },
    });
  }

  async getCouponByCode(code: string) {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Coupon not found');
    }

    return coupon;
  }
}

export default new OrderService();

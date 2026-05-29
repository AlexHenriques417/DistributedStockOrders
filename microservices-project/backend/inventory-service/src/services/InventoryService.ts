import prisma from '../lib/prisma';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { redis } from '../server';
import amqp from 'amqplib';
import { publishEvent } from '../config/rabbitmq';

const INVENTORY_CACHE_PREFIX = 'inventory:';
const CACHE_TTL = 300; // 5 minutes

export class InventoryService {
  // Get inventory item by ID with caching
  async getInventoryItem(itemId: string) {
    // Try cache first
    const cachedItem = await redis.get(`${INVENTORY_CACHE_PREFIX}${itemId}`);
    if (cachedItem) {
      return JSON.parse(cachedItem);
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { warehouse: true },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    // Cache the result
    await redis.setex(`${INVENTORY_CACHE_PREFIX}${itemId}`, CACHE_TTL, JSON.stringify(item));
    return item;
  }

  // Get inventory item by product ID
  async getInventoryByProductId(productId: string) {
    const cachedItem = await redis.get(`${INVENTORY_CACHE_PREFIX}product:${productId}`);
    if (cachedItem) {
      return JSON.parse(cachedItem);
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { productId },
      include: { warehouse: true },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found for product');
    }

    await redis.setex(`${INVENTORY_CACHE_PREFIX}product:${productId}`, CACHE_TTL, JSON.stringify(item));
    return item;
  }

  // Get inventory item by SKU
  async getInventoryBySku(sku: string) {
    const cachedItem = await redis.get(`${INVENTORY_CACHE_PREFIX}sku:${sku}`);
    if (cachedItem) {
      return JSON.parse(cachedItem);
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { sku },
      include: { warehouse: true },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found for SKU');
    }

    await redis.setex(`${INVENTORY_CACHE_PREFIX}sku:${sku}`, CACHE_TTL, JSON.stringify(item));
    return item;
  }

  // List all inventory items
  async listInventoryItems(filters?: {
    status?: string;
    warehouseId?: string;
    lowStock?: boolean;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters?.lowStock) {
      const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
      where.availableQty = { lte: threshold };
    }

    return prisma.inventoryItem.findMany({
      where,
      include: { warehouse: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Create inventory item (usually called by catalog.product.created event)
  async createInventoryItem(data: {
    productId: string;
    sku: string;
    name: string;
    description?: string;
    quantity?: number;
    reorderPoint?: number;
    reorderQty?: number;
    unitCost?: number;
    location?: string;
    warehouseId?: string;
  }) {
    const qty = data.quantity || 0;
    const item = await prisma.inventoryItem.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        name: data.name,
        description: data.description,
        quantity: qty,
        reservedQty: 0,
        availableQty: qty,
        reorderPoint: data.reorderPoint || parseInt(process.env.LOW_STOCK_THRESHOLD || '10'),
        reorderQty: data.reorderQty || 50,
        unitCost: data.unitCost || 0,
        location: data.location,
        warehouseId: data.warehouseId,
      },
    });

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    return item;
  }

  // Update inventory item
  async updateInventoryItem(itemId: string, data: any) {
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    return item;
  }

  // Stock adjustment with transaction tracking
  async adjustStock(itemId: string, data: {
    quantity: number;
    adjustmentType: 'add' | 'subtract' | 'set';
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    unitCost?: number;
    performedBy?: string;
  }, channel: amqp.Channel) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    const previousQty = item.quantity;
    let newQty: number;

    switch (data.adjustmentType) {
      case 'add':
        newQty = previousQty + data.quantity;
        break;
      case 'subtract':
        newQty = Math.max(0, previousQty - data.quantity);
        break;
      case 'set':
        newQty = data.quantity;
        break;
      default:
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid adjustment type');
    }

    const totalCost = data.unitCost ? data.quantity * data.unitCost : null;

    // Update inventory and create transaction in a single transaction
    const [updatedItem, transaction] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          availableQty: newQty - item.reservedQty,
          updatedAt: new Date(),
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: itemId,
          transactionType: data.adjustmentType === 'set' ? 'adjustment' : data.adjustmentType,
          quantity: data.quantity,
          previousQty,
          newQty,
          unitCost: data.unitCost,
          totalCost,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          performedBy: data.performedBy,
        },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(updatedItem.id, updatedItem.productId, updatedItem.sku);

    // Check for low stock and publish event
    await this.checkAndPublishLowStock(updatedItem, channel);

    // Publish stock adjusted event
    await publishEvent(channel, 'stock.adjusted', {
      itemId: updatedItem.id,
      productId: updatedItem.productId,
      sku: updatedItem.sku,
      previousQty,
      newQty,
      adjustmentType: data.adjustmentType,
      timestamp: new Date().toISOString(),
    });

    return { item: updatedItem, transaction };
  }

  // Reserve stock for an order
  async reserveStock(itemId: string, data: {
    orderId: string;
    quantity: number;
    expiresInSeconds?: number;
  }, channel: amqp.Channel) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    if (item.availableQty < data.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient stock available');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expiresInSeconds || 3600)); // Default 1 hour

    const reservation = await prisma.$transaction([
      prisma.stockReservation.create({
        data: {
          inventoryItemId: itemId,
          orderId: data.orderId,
          quantity: data.quantity,
          expiresAt,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          reservedQty: item.reservedQty + data.quantity,
          availableQty: item.availableQty - data.quantity,
          updatedAt: new Date(),
        },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    // Publish stock reserved event
    await publishEvent(channel, 'stock.reserved', {
      reservationId: (reservation[0] as any).id,
      itemId,
      productId: item.productId,
      sku: item.sku,
      orderId: data.orderId,
      quantity: data.quantity,
      expiresAt: expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    });

    return reservation[0];
  }

  // Release reserved stock
  async releaseStock(itemId: string, data: {
    orderId: string;
    quantity: number;
  }, channel: amqp.Channel) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    // Find the reservation
    const reservation = await prisma.stockReservation.findFirst({
      where: {
        inventoryItemId: itemId,
        orderId: data.orderId,
        status: 'reserved',
      },
    });

    if (!reservation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Active reservation not found');
    }

    // Update reservation status and inventory
    const result = await prisma.$transaction([
      prisma.stockReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'released',
          releasedAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          reservedQty: Math.max(0, item.reservedQty - data.quantity),
          availableQty: item.availableQty + data.quantity,
          updatedAt: new Date(),
        },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    // Publish stock released event
    await publishEvent(channel, 'stock.released', {
      reservationId: reservation.id,
      itemId,
      productId: item.productId,
      sku: item.sku,
      orderId: data.orderId,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
    });

    return result[1];
  }

  // Confirm stock reservation (convert to actual deduction)
  async confirmReservation(itemId: string, data: {
    orderId: string;
    quantity: number;
  }, channel: amqp.Channel) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    const reservation = await prisma.stockReservation.findFirst({
      where: {
        inventoryItemId: itemId,
        orderId: data.orderId,
        status: 'reserved',
      },
    });

    if (!reservation) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Active reservation not found');
    }

    const previousQty = item.quantity;
    const newQty = item.quantity - data.quantity;

    const result = await prisma.$transaction([
      prisma.stockReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'confirmed',
          updatedAt: new Date(),
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          reservedQty: Math.max(0, item.reservedQty - data.quantity),
          updatedAt: new Date(),
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: itemId,
          transactionType: 'sale',
          quantity: data.quantity,
          previousQty,
          newQty,
          referenceType: 'order',
          referenceId: data.orderId,
        },
      }),
    ]);

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    // Check for low stock
    const updatedItem = result[1] as any;
    await this.checkAndPublishLowStock(updatedItem, channel);

    return updatedItem;
  }

  // Stock transfer between warehouses
  async transferStock(itemId: string, data: {
    targetWarehouseId: string;
    quantity: number;
    notes?: string;
  }, channel: amqp.Channel) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inventory item not found');
    }

    const targetWarehouse = await prisma.warehouse.findUnique({
      where: { id: data.targetWarehouseId },
    });

    if (!targetWarehouse) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Target warehouse not found');
    }

    if (item.availableQty < data.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient stock available for transfer');
    }

    const previousQty = item.quantity;

    // Create or update inventory item at target warehouse
    const targetItem = await prisma.inventoryItem.findFirst({
      where: {
        productId: item.productId,
        warehouseId: data.targetWarehouseId,
      },
    });

    let result;
    if (targetItem) {
      // Update existing item
      result = await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity - data.quantity,
            availableQty: item.availableQty - data.quantity,
            updatedAt: new Date(),
          },
        }),
        prisma.inventoryItem.update({
          where: { id: targetItem.id },
          data: {
            quantity: targetItem.quantity + data.quantity,
            availableQty: targetItem.availableQty + data.quantity,
            updatedAt: new Date(),
          },
        }),
        prisma.inventoryTransaction.create({
          data: {
            inventoryItemId: item.id,
            transactionType: 'transfer_out',
            quantity: data.quantity,
            previousQty,
            newQty: item.quantity - data.quantity,
            referenceType: 'warehouse',
            referenceId: data.targetWarehouseId,
            notes: data.notes,
          },
        }),
        prisma.inventoryTransaction.create({
          data: {
            inventoryItemId: targetItem.id,
            transactionType: 'transfer_in',
            quantity: data.quantity,
            previousQty: targetItem.quantity,
            newQty: targetItem.quantity + data.quantity,
            referenceType: 'warehouse',
            referenceId: item.warehouseId,
            notes: data.notes,
          },
        }),
      ]);
    } else {
      // Create new inventory item at target warehouse
      result = await prisma.$transaction([
        prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity - data.quantity,
            availableQty: item.availableQty - data.quantity,
            updatedAt: new Date(),
          },
        }),
        prisma.inventoryItem.create({
          data: {
            productId: item.productId,
            sku: `${item.sku}-${targetWarehouse.code}`,
            name: item.name,
            description: item.description,
            quantity: data.quantity,
            reservedQty: 0,
            availableQty: data.quantity,
            reorderPoint: item.reorderPoint,
            reorderQty: item.reorderQty,
            unitCost: item.unitCost,
            warehouseId: data.targetWarehouseId,
            location: item.location,
          },
        }),
        prisma.inventoryTransaction.create({
          data: {
            inventoryItemId: item.id,
            transactionType: 'transfer_out',
            quantity: data.quantity,
            previousQty,
            newQty: item.quantity - data.quantity,
            referenceType: 'warehouse',
            referenceId: data.targetWarehouseId,
            notes: data.notes,
          },
        }),
      ]);
    }

    // Invalidate cache
    await this.invalidateCache(item.id, item.productId, item.sku);

    return result[1];
  }

  // Get stock availability for a product
  async checkAvailability(productId: string, quantity: number) {
    const item = await prisma.inventoryItem.findUnique({
      where: { productId },
    });

    if (!item) {
      return {
        productId,
        available: false,
        availableQty: 0,
        requestedQty: quantity,
        message: 'Product not found in inventory',
      };
    }

    return {
      productId,
      available: item.availableQty >= quantity,
      availableQty: item.availableQty,
      reservedQty: item.reservedQty,
      totalQty: item.quantity,
      requestedQty: quantity,
      message: item.availableQty >= quantity
        ? 'Stock available'
        : `Insufficient stock. Available: ${item.availableQty}, Requested: ${quantity}`,
    };
  }

  // Get transaction history for an item
  async getTransactionHistory(itemId: string, filters?: {
    transactionType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { inventoryItemId: itemId };

    if (filters?.transactionType) {
      where.transactionType = filters.transactionType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  // Get reservations for an item
  async getReservations(itemId: string, filters?: {
    status?: string;
    orderId?: string;
  }) {
    const where: any = { inventoryItemId: itemId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    return prisma.stockReservation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Clean up expired reservations
  async cleanupExpiredReservations(channel: amqp.Channel) {
    const expiredReservations = await prisma.stockReservation.findMany({
      where: {
        status: 'reserved',
        expiresAt: { lt: new Date() },
      },
      include: { inventoryItem: true },
    });

    for (const reservation of expiredReservations) {
      await this.releaseStock(reservation.inventoryItemId, {
        orderId: reservation.orderId,
        quantity: reservation.quantity,
      }, channel);

      console.log(`Released expired reservation: ${reservation.id}`);
    }

    return { releasedCount: expiredReservations.length };
  }

  // Warehouse operations
  async createWarehouse(data: {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
    email?: string;
    capacity?: number;
  }) {
    return prisma.warehouse.create({ data });
  }

  async updateWarehouse(warehouseId: string, data: any) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Warehouse not found');
    }

    return prisma.warehouse.update({
      where: { id: warehouseId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async getWarehouse(warehouseId: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        inventoryItems: {
          where: { status: 'active' },
        },
      },
    });

    if (!warehouse) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Warehouse not found');
    }

    // Calculate statistics
    const stats = {
      totalItems: warehouse.inventoryItems.length,
      totalQuantity: warehouse.inventoryItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: warehouse.inventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
    };

    return { warehouse, stats };
  }

  async listWarehouses(filters?: { status?: string }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.warehouse.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  // Private helper methods
  private async invalidateCache(itemId: string, productId: string, sku: string) {
    await redis.del(`${INVENTORY_CACHE_PREFIX}${itemId}`);
    await redis.del(`${INVENTORY_CACHE_PREFIX}product:${productId}`);
    await redis.del(`${INVENTORY_CACHE_PREFIX}sku:${sku}`);
  }

  private async checkAndPublishLowStock(item: any, channel: amqp.Channel) {
    const lowThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10');
    const criticalThreshold = parseInt(process.env.CRITICAL_STOCK_THRESHOLD || '5');

    if (item.availableQty <= criticalThreshold) {
      await publishEvent(channel, 'stock.critical', {
        itemId: item.id,
        productId: item.productId,
        sku: item.sku,
        availableQty: item.availableQty,
        threshold: criticalThreshold,
        reorderPoint: item.reorderPoint,
        reorderQty: item.reorderQty,
        timestamp: new Date().toISOString(),
      });
    } else if (item.availableQty <= lowThreshold) {
      await publishEvent(channel, 'stock.low', {
        itemId: item.id,
        productId: item.productId,
        sku: item.sku,
        availableQty: item.availableQty,
        threshold: lowThreshold,
        reorderPoint: item.reorderPoint,
        reorderQty: item.reorderQty,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default new InventoryService();
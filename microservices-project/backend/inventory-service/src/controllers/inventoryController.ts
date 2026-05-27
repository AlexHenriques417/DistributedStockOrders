import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import inventoryService from '../services/inventoryService';
import { AuthRequest } from '../middleware/auth';

export class InventoryController {
  // Inventory Item Endpoints
  async getInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const item = await inventoryService.getInventoryItem(itemId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const item = await inventoryService.getInventoryByProductId(productId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryBySku(req: Request, res: Response, next: NextFunction) {
    try {
      const { sku } = req.params;
      const item = await inventoryService.getInventoryBySku(sku);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async listInventoryItems(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
        warehouseId: req.query.warehouseId as string,
        lowStock: req.query.lowStock === 'true',
      };
      const items = await inventoryService.listInventoryItems(filters);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async createInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.createInventoryItem(req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const item = await inventoryService.updateInventoryItem(itemId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Stock Operations
  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const channel = req.app.get('rabbitmqChannel');
      const performedBy = (req as AuthRequest).user?.id;

      const result = await inventoryService.adjustStock(itemId, {
        ...req.body,
        performedBy,
      }, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const channel = req.app.get('rabbitmqChannel');

      const reservation = await inventoryService.reserveStock(itemId, req.body, channel);

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const channel = req.app.get('rabbitmqChannel');

      const result = await inventoryService.releaseStock(itemId, req.body, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmReservation(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const channel = req.app.get('rabbitmqChannel');

      const result = await inventoryService.confirmReservation(itemId, req.body, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async transferStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const channel = req.app.get('rabbitmqChannel');

      const result = await inventoryService.transferStock(itemId, req.body, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const quantity = parseInt(req.query.quantity as string) || 1;

      const result = await inventoryService.checkAvailability(productId, quantity);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Transaction History
  async getTransactionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const filters = {
        transactionType: req.query.transactionType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await inventoryService.getTransactionHistory(itemId, filters);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.transactions,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  // Reservations
  async getReservations(req: Request, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const filters = {
        status: req.query.status as string,
        orderId: req.query.orderId as string,
      };

      const reservations = await inventoryService.getReservations(itemId, filters);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: reservations,
      });
    } catch (error) {
      next(error);
    }
  }

  // Warehouse Endpoints
  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.createWarehouse(req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.params;
      const result = await inventoryService.getWarehouse(warehouseId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId } = req.params;
      const warehouse = await inventoryService.updateWarehouse(warehouseId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async listWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string,
      };
      const warehouses = await inventoryService.listWarehouses(filters);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();

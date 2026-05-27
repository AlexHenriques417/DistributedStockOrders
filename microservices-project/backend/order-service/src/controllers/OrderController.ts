import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import orderService from '../services/orderService';
import { sagaOrchestrator } from '../services/sagaOrchestrator';
import { AuthRequest } from '../middleware/auth';

export class OrderController {
  // Order endpoints
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const channel = req.app.get('rabbitmqChannel');
      const order = await orderService.createOrder(userId!, req.body, channel);

      // Start the saga for order processing
      await sagaOrchestrator.startOrderSaga(order.id, channel);

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = (req as AuthRequest).user?.id;
      const isAdmin = (req as AuthRequest).user?.role === 'admin';

      // Admin can view any order, users can only view their own
      const order = await orderService.getOrderById(
        orderId,
        isAdmin ? undefined : userId
      );

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const query = req.query;
      const result = await orderService.getOrdersByUser(userId!, {
        status: query.status as string,
        page: parseInt(query.page as string) || 1,
        limit: parseInt(query.limit as string) || 10,
        startDate: query.startDate as string,
        endDate: query.endDate as string,
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const channel = req.app.get('rabbitmqChannel');
      const order = await orderService.updateOrderStatus(orderId, req.body, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = (req as AuthRequest).user?.id;
      const channel = req.app.get('rabbitmqChannel');
      const order = await orderService.cancelOrder(orderId, userId!, req.body, channel);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Saga state endpoint
  async getOrderSagaState(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const sagaState = await sagaOrchestrator.getSagaState(orderId);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: sagaState,
      });
    } catch (error) {
      next(error);
    }
  }

  // Shopping Cart endpoints
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const cart = await orderService.getCartSummary(userId!);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const item = await orderService.addToCart(userId!, req.body);

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const { itemId } = req.params;
      const item = await orderService.updateCartItem(userId!, itemId, req.body);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const { itemId } = req.params;
      const result = await orderService.removeFromCart(userId!, itemId);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const result = await orderService.clearCart(userId!);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Checkout from cart
  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const channel = req.app.get('rabbitmqChannel');

      // Get cart
      const cart = await orderService.getCartSummary(userId!);

      if (cart.itemCount === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Cart is empty',
        });
      }

      // Create order from cart items
      const orderData = {
        items: cart.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
        })),
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.billingAddress,
        paymentMethod: req.body.paymentMethod,
        couponCode: req.body.couponCode,
        notes: req.body.notes,
      };

      const order = await orderService.createOrder(userId!, orderData, channel);

      // Clear cart after order creation
      await orderService.clearCart(userId!);

      // Start the saga for order processing
      await sagaOrchestrator.startOrderSaga(order.id, channel);

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Coupon endpoints
  async validateCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.validateCoupon(req.body);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await orderService.createCoupon(req.body);

      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCouponByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const coupon = await orderService.getCouponByCode(code);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();

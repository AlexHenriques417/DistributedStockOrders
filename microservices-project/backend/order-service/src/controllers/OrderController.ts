import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import orderService from '../services/orderService';
import { sagaOrchestrator } from '../services/sagaOrchestrator';
import { AuthRequest } from '../middleware/auth';

export class OrderController {
  // Order endpoints
  async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;
      const channel = req.app.get('rabbitmqChannel');

      const order = await orderService.createOrder(
        userId!,
        req.body,
        channel
      );

      // Start saga
      await sagaOrchestrator.startOrderSaga(order.id, channel);

      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { orderId } = req.params;

      const userId = (req as AuthRequest).user?.id;
      const isAdmin =
        (req as AuthRequest).user?.role === 'admin';

      const order = await orderService.getOrderById(
        orderId,
        isAdmin ? undefined : userId
      );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const query = req.query;

      const result = await orderService.getOrdersByUser(
        userId!,
        {
          status: query.status as string,
          page: parseInt(query.page as string) || 1,
          limit: parseInt(query.limit as string) || 10,
          startDate: query.startDate as string,
          endDate: query.endDate as string,
        }
      );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { orderId } = req.params;

      const channel = req.app.get('rabbitmqChannel');

      const order =
        await orderService.updateOrderStatus(
          orderId,
          req.body,
          channel
        );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  async cancelOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { orderId } = req.params;

      const userId = (req as AuthRequest).user?.id;

      const channel = req.app.get('rabbitmqChannel');

      const order = await orderService.cancelOrder(
        orderId,
        userId!,
        req.body,
        channel
      );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Saga state endpoint
  async getOrderSagaState(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { orderId } = req.params;

      const sagaState =
        await sagaOrchestrator.getSagaState(orderId);

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: sagaState,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Shopping Cart endpoints
  async getCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const cart = await orderService.getCartSummary(
        userId!
      );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: cart,
      });
    } catch (error) {
      return next(error);
    }
  }

  async addToCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const item = await orderService.addToCart(
        userId!,
        req.body
      );

      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateCartItem(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const { itemId } = req.params;

      const item =
        await orderService.updateCartItem(
          userId!,
          itemId,
          req.body
        );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: item,
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeFromCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const { itemId } = req.params;

      const result =
        await orderService.removeFromCart(
          userId!,
          itemId
        );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async clearCart(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const result = await orderService.clearCart(
        userId!
      );

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Checkout from cart
  async checkout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = (req as AuthRequest).user?.id;

      const channel = req.app.get('rabbitmqChannel');

      const cart = await orderService.getCartSummary(
        userId!
      );

      if (cart.itemCount === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Cart is empty',
        });
      }

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

      const order = await orderService.createOrder(
        userId!,
        orderData,
        channel
      );

      // Clear cart
      await orderService.clearCart(userId!);

      // Start saga
      await sagaOrchestrator.startOrderSaga(
        order.id,
        channel
      );

      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Coupon endpoints
  async validateCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const result =
        await orderService.validateCoupon(req.body);

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createCoupon(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const coupon =
        await orderService.createCoupon(req.body);

      return res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getCouponByCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { code } = req.params;

      const coupon =
        await orderService.getCouponByCode(code);

      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: coupon,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new OrderController();
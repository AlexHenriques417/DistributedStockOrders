import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import paymentService from '../services/paymentService';
import { ProcessPaymentDto, RefundPaymentDto, ListPaymentsDto } from '../dtos/payment.dto';
import { AuthRequest } from '../middleware/auth';

export class PaymentController {
  async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data: ProcessPaymentDto = req.body;
      const channel = req.app.get('rabbitmqChannel');
      const result = await paymentService.processPayment(data, channel);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentById(paymentId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const payment = await paymentService.getPaymentByOrderId(orderId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: ListPaymentsDto = {
        orderId: req.query.orderId as string,
        userId: req.query.userId as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };
      const result = await paymentService.listPayments(filters);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const data: RefundPaymentDto = req.body;
      const channel = req.app.get('rabbitmqChannel');
      const result = await paymentService.processRefund(data, channel);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const channel = req.app.get('rabbitmqChannel');
      const result = await paymentService.cancelPayment(paymentId, channel);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const transactions = await paymentService.getPaymentTransactions(paymentId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const filters: ListPaymentsDto = {
        userId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        status: req.query.status as string,
      };
      const result = await paymentService.listPayments(filters);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();

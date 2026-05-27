import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { validateDto } from '../middleware/validateDto';
import { authMiddleware } from '../middleware/auth';
import { ProcessPaymentDto, RefundPaymentDto } from '../dtos/payment.dto';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Payment processing
router.post('/process', validateDto(ProcessPaymentDto), paymentController.processPayment);

// Payment queries
router.get('/', paymentController.listPayments);
router.get('/user', paymentController.getUserPayments);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);
router.get('/:paymentId', paymentController.getPaymentById);
router.get('/:paymentId/transactions', paymentController.getPaymentTransactions);

// Refund operations
router.post('/refund', validateDto(RefundPaymentDto), paymentController.processRefund);

// Payment cancellation
router.post('/:paymentId/cancel', paymentController.cancelPayment);

export default router;

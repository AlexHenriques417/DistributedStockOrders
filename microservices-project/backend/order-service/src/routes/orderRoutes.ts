import { Router } from 'express';
import orderController from '../controllers/orderController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validateDto } from '../middleware/validateDto';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  AddToCartDto,
  UpdateCartItemDto,
  CreateCouponDto,
  ValidateCouponDto,
} from '../dtos/order.dto';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Order routes
router.post('/', validateDto(CreateOrderDto), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);
router.get('/:orderId/saga', orderController.getOrderSagaState);
router.put('/:orderId/status', roleMiddleware('admin'), validateDto(UpdateOrderStatusDto), orderController.updateOrderStatus);
router.post('/:orderId/cancel', validateDto(CancelOrderDto), orderController.cancelOrder);

// Shopping cart routes
router.get('/cart/items', orderController.getCart);
router.post('/cart/items', validateDto(AddToCartDto), orderController.addToCart);
router.put('/cart/items/:itemId', validateDto(UpdateCartItemDto), orderController.updateCartItem);
router.delete('/cart/items/:itemId', orderController.removeFromCart);
router.delete('/cart/items', orderController.clearCart);

// Checkout route
router.post('/checkout', orderController.checkout);

// Coupon routes (some admin-only)
router.post('/coupons/validate', validateDto(ValidateCouponDto), orderController.validateCoupon);
router.post('/coupons', roleMiddleware('admin'), validateDto(CreateCouponDto), orderController.createCoupon);
router.get('/coupons/:code', roleMiddleware('admin'), orderController.getCouponByCode);

export default router;

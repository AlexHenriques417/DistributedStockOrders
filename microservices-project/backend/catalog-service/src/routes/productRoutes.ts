import { Router } from 'express';
import productController from '../controllers/productController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validateDto } from '../middleware/validateDto';
import { productQueryDto } from '../dtos/productQuery.dto';

const router = Router();

// Public routes (no auth required)
// Product listing and search
router.get('/', productController.listProducts);
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/sku/:sku', productController.getProductBySku);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:productId', productController.getProductById);

// Product reviews (public)
router.get('/:productId/reviews', productController.getProductReviews);

// Protected routes (auth required)
router.use(authMiddleware);

// Product CRUD
router.post(
  '/',
  roleMiddleware('admin', 'manager'),
  productController.createProduct
);

router.put(
  '/:productId',
  roleMiddleware('admin', 'manager'),
  productController.updateProduct
);

router.delete(
  '/:productId',
  roleMiddleware('admin'),
  productController.deleteProduct
);

// Product images
router.post(
  '/images',
  roleMiddleware('admin', 'manager'),
  productController.createProductImage
);

router.delete(
  '/images/:imageId',
  roleMiddleware('admin', 'manager'),
  productController.deleteProductImage
);

// Product variants
router.post(
  '/variants',
  roleMiddleware('admin', 'manager'),
  productController.createProductVariant
);

router.put(
  '/variants/:variantId',
  roleMiddleware('admin', 'manager'),
  productController.updateProductVariant
);

router.delete(
  '/variants/:variantId',
  roleMiddleware('admin', 'manager'),
  productController.deleteProductVariant
);

// Product reviews (protected)
router.post(
  '/:productId/reviews',
  productController.createProductReview
);

router.put(
  '/:productId/reviews/:reviewId',
  productController.updateProductReview
);

router.delete(
  '/:productId/reviews/:reviewId',
  productController.deleteProductReview
);

export default router;
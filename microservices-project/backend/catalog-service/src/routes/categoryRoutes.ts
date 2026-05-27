import { Router } from 'express';
import categoryController from '../controllers/categoryController';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', categoryController.listCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:categoryId', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:categoryId/products', categoryController.getProductsByCategory);

// Protected routes
router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware('admin', 'manager'),
  categoryController.createCategory
);

router.put(
  '/:categoryId',
  roleMiddleware('admin', 'manager'),
  categoryController.updateCategory
);

router.delete(
  '/:categoryId',
  roleMiddleware('admin'),
  categoryController.deleteCategory
);

export default router;

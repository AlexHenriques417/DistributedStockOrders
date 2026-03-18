import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';

const router = Router();

router.get('/products', CatalogController.getAll);
router.post('/products', CatalogController.create);
router.put('/products/:id', CatalogController.update);
router.delete('/products/:id', CatalogController.delete);

export default router;
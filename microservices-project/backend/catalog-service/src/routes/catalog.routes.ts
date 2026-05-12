import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';

const router = Router();

// QUERIES (leitura)
router.get('/',    CatalogController.getAll);
router.get('/:id', CatalogController.getById);

// COMMANDS (escrita)
router.post('/',    CatalogController.create);
router.put('/:id',  CatalogController.update);
router.delete('/:id', CatalogController.delete);

export default router;

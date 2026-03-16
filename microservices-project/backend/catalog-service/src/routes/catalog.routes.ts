import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';

const router = Router();
const controller = new CatalogController();

router.get('/', (req, res) => controller.list(req, res));
router.post('/', (req, res) => controller.store(req, res));

export default router;
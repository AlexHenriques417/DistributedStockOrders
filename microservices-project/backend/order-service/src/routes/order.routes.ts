import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const controller = new OrderController();

router.post('/', (req, res) => controller.store(req, res));
router.get('/:id', (req, res) => controller.show(req, res));

export default router;
import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const controller = new OrderController();

router.get('/',      (req, res) => controller.index(req, res));        // GET   /order
router.post('/',     (req, res) => controller.store(req, res));        // POST  /order
router.get('/:id',   (req, res) => controller.show(req, res));         // GET   /order/:id
router.patch('/:id', (req, res) => controller.updateStatus(req, res)); // PATCH /order/:id

export default router;
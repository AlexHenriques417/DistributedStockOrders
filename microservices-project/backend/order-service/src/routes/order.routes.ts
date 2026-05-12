import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router     = Router();
const controller = new OrderController();

// QUERIES (leitura)
router.get('/',                    (req, res) => controller.index(req, res));
router.get('/user/:userId',        (req, res) => controller.byUser(req, res));
router.get('/:id',                 (req, res) => controller.show(req, res));

// COMMANDS (escrita)
router.post('/',                   (req, res) => controller.store(req, res));
router.patch('/:id/status',        (req, res) => controller.updateStatus(req, res));

export default router;

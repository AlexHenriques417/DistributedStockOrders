import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';

const router = Router();
const controller = new PaymentController();

router.post('/process',          (req, res) => controller.process(req, res));   // POST   /payment/process
router.get('/status/:orderId',   (req, res) => controller.getStatus(req, res)); // GET    /payment/status/:orderId

export default router;
import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const controller = new UserController();

router.post('/', (req, res) => controller.store(req, res));
router.get('/me', (req, res) => controller.profile(req, res));

export default router;
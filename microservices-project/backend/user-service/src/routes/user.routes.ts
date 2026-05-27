import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const controller = new UserController();

router.get('/',          (req, res) => controller.index(req, res));    // GET    /user
router.post('/',         (req, res) => controller.store(req, res));    // POST   /user
router.post('/register', (req, res) => controller.register(req, res)); // POST   /user/register
router.post('/login',    (req, res) => controller.login(req, res));    // POST   /user/login
router.get('/:id',       (req, res) => controller.profile(req, res));  // GET    /user/:id
router.delete('/:id',    (req, res) => controller.destroy(req, res));  // DELETE /user/:id

export default router;
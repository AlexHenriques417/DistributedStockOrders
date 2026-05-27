import { Router } from 'express';
import authController from '../controllers/authController';
import { validateDto } from '../middleware/validateDto';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';

const router = Router();

router.post('/register', validateDto(RegisterDto), authController.register);
router.post('/login', validateDto(LoginDto), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;

import { Router } from 'express';
import userController from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/change-password', userController.changePassword);

router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

export default router;

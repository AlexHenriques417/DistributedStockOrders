import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

export default {
  authRoutes,
  userRoutes,
};

export { authRoutes, userRoutes };

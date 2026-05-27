import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { ApiError, AuthRequest } from '../middleware';

const router = Router();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/profile`, {
      headers: {
        Authorization: req.headers.authorization,
        'X-User-ID': (req as AuthRequest).user?.id,
      },
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user profile'));
    }
  }
});

router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.put(`${USER_SERVICE_URL}/api/users/profile`, req.body, {
      headers: {
        Authorization: req.headers.authorization,
        'X-User-ID': (req as AuthRequest).user?.id,
      },
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update user profile'));
    }
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${req.params.id}`, {
      headers: {
        Authorization: req.headers.authorization,
        'X-User-ID': (req as AuthRequest).user?.id,
      },
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch user'));
    }
  }
});

export default router;

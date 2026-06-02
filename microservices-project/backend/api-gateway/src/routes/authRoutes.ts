import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3006';

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/auth/register`, req.body);
    res.status(StatusCodes.CREATED).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to register user'));
    }
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/auth/login`, req.body);
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to login'));
    }
  }
});

router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/auth/refresh-token`, req.body);
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to refresh token'));
    }
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/auth/logout`, req.body, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    res.status(StatusCodes.OK).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      next(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to logout'));
    }
  }
});

export default router;

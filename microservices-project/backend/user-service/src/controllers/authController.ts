import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import authService from '../services/authService';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data: RegisterDto = req.body;
      const channel = req.app.get('rabbitmqChannel');
      const result = await authService.register(data, channel);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data: LoginDto = req.body;
      const channel = req.app.get('rabbitmqChannel');
      const result = await authService.login(data, channel);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const result = await authService.logout(userId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();

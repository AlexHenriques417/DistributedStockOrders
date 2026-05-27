import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import userService from '../services/userService';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const user = await userService.getUserById(userId!);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const user = await userService.updateUser(userId!, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const result = await userService.changePassword(userId!, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const address = await userService.createAddress(userId!, req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const addresses = await userService.getAddresses(userId!);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const { addressId } = req.params;
      const address = await userService.updateAddress(userId!, addressId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const { addressId } = req.params;
      const result = await userService.deleteAddress(userId!, addressId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const preferences = await userService.getPreferences(userId!);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthRequest).user?.id;
      const preferences = await userService.updatePreferences(userId!, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();

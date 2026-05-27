import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from './errorHandler';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = Object.assign(new dtoClass(), req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints || {}))
        .join(', ');

      next(new ApiError(StatusCodes.BAD_REQUEST, `Validation failed: ${messages}`));
    } else {
      req.body = dto;
      next();
    }
  };
};

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import productService from '../services/productService';
import connect from 'amqplib';

export class CategoryController {
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const category = await productService.createCategory(channel, req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const category = await productService.getCategoryById(categoryId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const category = await productService.getCategoryBySlug(slug);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const category = await productService.updateCategory(channel, categoryId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const result = await productService.deleteCategory(channel, categoryId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { activeOnly, includeParent } = req.query;
      const categories = await productService.listCategories(
        activeOnly !== 'false',
        includeParent === 'true'
      );
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await productService.getCategoryTree();
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const { limit } = req.query;
      const products = await productService.getProductsByCategory(
        categoryId,
        limit ? parseInt(limit as string) : 20
      );
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();

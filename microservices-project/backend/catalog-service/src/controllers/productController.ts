import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import productService from '../services/productService';
import { AuthRequest } from '../middleware/auth';
import connect from 'amqplib';

export class ProductController {
  // Product CRUD
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const product = await productService.createProduct(channel, req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const product = await productService.getProductById(productId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySku(req: Request, res: Response, next: NextFunction) {
    try {
      const { sku } = req.params;
      const product = await productService.getProductBySku(sku);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const product = await productService.updateProduct(channel, productId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const result = await productService.deleteProduct(channel, productId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search,
        categoryId,
        status,
        brand,
        isFeatured,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await productService.listProducts({
        search: search as string,
        categoryId: categoryId as string,
        status: status as string,
        brand: brand as string,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const products = await productService.getFeaturedProducts(
        limit ? parseInt(limit as string) : 10
      );
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: products,
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

  async searchProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page, limit } = req.query;
      const result = await productService.searchProducts(
        q as string,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Product Images
  async createProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const image = await productService.createProductImage(channel, req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { imageId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const result = await productService.deleteProductImage(channel, imageId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Product Variants
  async createProductVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const variant = await productService.createProductVariant(channel, req.body);
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const variant = await productService.updateProductVariant(channel, variantId, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProductVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const { variantId } = req.params;
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const result = await productService.deleteProductVariant(channel, variantId);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Product Reviews
  async createProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.app.get('rabbitmqChannel') as connect.Channel;
      const userId = (req as AuthRequest).user?.id || req.body.userId;
      const review = await productService.createProductReview(channel, {
        ...req.body,
        userId,
      });
      res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = (req as AuthRequest).user?.id || req.body.userId;
      const review = await productService.updateProductReview(reviewId, userId!, req.body);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = (req as AuthRequest).user?.id || req.body.userId;
      const result = await productService.deleteProductReview(reviewId, userId!);
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { page, limit } = req.query;
      const reviews = await productService.getProductReviews(
        productId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 10
      );
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();

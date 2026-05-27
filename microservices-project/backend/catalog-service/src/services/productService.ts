import { PrismaClient } from '@prisma/client';
import connect from 'amqplib';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { redis } from '../server';

// Import commands
import {
  CreateProductCommand,
  UpdateProductCommand,
  DeleteProductCommand,
  CreateProductImageCommand,
  DeleteProductImageCommand,
  CreateProductVariantCommand,
  UpdateProductVariantCommand,
  DeleteProductVariantCommand,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
} from '../commands/productCommands';

// Import queries
import {
  GetProductByIdQuery,
  GetProductBySkuQuery,
  GetProductBySlugQuery,
  ListProductsQuery,
  GetFeaturedProductsQuery,
  GetProductsByCategoryQuery,
  GetCategoryByIdQuery,
  GetCategoryBySlugQuery,
  ListCategoriesQuery,
  GetCategoryTreeQuery,
  GetProductReviewsQuery,
  SearchProductsQuery,
} from '../queries/productQueries';

import {
  CreateProductDto,
  UpdateProductDto,
  CreateProductImageDto,
  UpdateProductImageDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  CreateProductReviewDto,
  UpdateProductReviewDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dtos/product.dto';

const prisma = new PrismaClient();

export class ProductService {
  // Product Commands
  async createProduct(channel: connect.Channel, data: CreateProductDto) {
    // Check if SKU exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      throw new ApiError(StatusCodes.CONFLICT, 'Product with this SKU already exists');
    }

    // Check if slug exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new ApiError(StatusCodes.CONFLICT, 'Product with this slug already exists');
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    const command = new CreateProductCommand(data, channel);
    return command.execute();
  }

  async updateProduct(channel: connect.Channel, productId: string, data: UpdateProductDto) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    // Check for unique SKU if updating
    if (data.sku && data.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        throw new ApiError(StatusCodes.CONFLICT, 'SKU already in use');
      }
    }

    // Check for unique slug if updating
    if (data.slug && data.slug !== product.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw new ApiError(StatusCodes.CONFLICT, 'Slug already in use');
      }
    }

    const command = new UpdateProductCommand(productId, data, channel);
    return command.execute();
  }

  async deleteProduct(channel: connect.Channel, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    const command = new DeleteProductCommand(productId, channel);
    return command.execute();
  }

  // Product Queries
  async getProductById(productId: string) {
    const query = new GetProductByIdQuery(productId);
    const product = await query.execute();

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    return product;
  }

  async getProductBySku(sku: string) {
    const query = new GetProductBySkuQuery(sku);
    const product = await query.execute();

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    return product;
  }

  async getProductBySlug(slug: string) {
    const query = new GetProductBySlugQuery(slug);
    const product = await query.execute();

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    return product;
  }

  async listProducts(params: {
    search?: string;
    categoryId?: string;
    status?: string;
    brand?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const query = new ListProductsQuery(params);
    return query.execute();
  }

  async getFeaturedProducts(limit: number = 10) {
    const query = new GetFeaturedProductsQuery(limit);
    return query.execute();
  }

  async getProductsByCategory(categoryId: string, limit: number = 20) {
    const query = new GetProductsByCategoryQuery(categoryId, limit);
    return query.execute();
  }

  async searchProducts(queryString: string, page: number = 1, limit: number = 20) {
    const query = new SearchProductsQuery(queryString, page, limit);
    return query.execute();
  }

  // Product Image Commands
  async createProductImage(channel: connect.Channel, data: CreateProductImageDto) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    const command = new CreateProductImageCommand(data, channel);
    return command.execute();
  }

  async deleteProductImage(channel: connect.Channel, imageId: string) {
    const command = new DeleteProductImageCommand(imageId, channel);
    const result = await command.execute();

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Image not found');
    }

    return result;
  }

  // Product Variant Commands
  async createProductVariant(channel: connect.Channel, data: CreateProductVariantDto) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    // Check if SKU exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });

    if (existingVariant) {
      throw new ApiError(StatusCodes.CONFLICT, 'Variant SKU already exists');
    }

    const command = new CreateProductVariantCommand(data, channel);
    return command.execute();
  }

  async updateProductVariant(channel: connect.Channel, variantId: string, data: UpdateProductVariantDto) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Variant not found');
    }

    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        throw new ApiError(StatusCodes.CONFLICT, 'SKU already in use');
      }
    }

    const command = new UpdateProductVariantCommand(variantId, data, channel);
    return command.execute();
  }

  async deleteProductVariant(channel: connect.Channel, variantId: string) {
    const command = new DeleteProductVariantCommand(variantId, channel);
    const result = await command.execute();

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Variant not found');
    }

    return result;
  }

  // Product Review Commands
  async createProductReview(channel: connect.Channel, data: CreateProductReviewDto) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    // Check if user already reviewed
    const existingReview = await prisma.productReview.findFirst({
      where: { productId: data.productId, userId: data.userId },
    });

    if (existingReview) {
      throw new ApiError(StatusCodes.CONFLICT, 'You have already reviewed this product');
    }

    const review = await prisma.productReview.create({
      data: {
        productId: data.productId,
        userId: data.userId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
      },
    });

    await channel.publish(
      process.env.RABBITMQ_EXCHANGE || 'catalog.events',
      'product.review.created',
      Buffer.from(JSON.stringify({
        reviewId: review.id,
        productId: data.productId,
        userId: data.userId,
        rating: data.rating,
        timestamp: new Date().toISOString(),
      })),
      { persistent: true }
    );

    return review;
  }

  async updateProductReview(reviewId: string, userId: string, data: UpdateProductReviewDto) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only update your own reviews');
    }

    return prisma.productReview.update({
      where: { id: reviewId },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async deleteProductReview(reviewId: string, userId: string) {
    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You can only delete your own reviews');
    }

    await prisma.productReview.delete({
      where: { id: reviewId },
    });

    return { success: true, reviewId };
  }

  // Product Review Queries
  async getProductReviews(productId: string, page: number = 1, limit: number = 10) {
    const query = new GetProductReviewsQuery(productId, page, limit);
    return query.execute();
  }

  // Category Commands
  async createCategory(channel: connect.Channel, data: CreateCategoryDto) {
    const existingSlug = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new ApiError(StatusCodes.CONFLICT, 'Category with this slug already exists');
    }

    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Parent category not found');
      }
    }

    const command = new CreateCategoryCommand(data, channel);
    return command.execute();
  }

  async updateCategory(channel: connect.Channel, categoryId: string, data: UpdateCategoryDto) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        throw new ApiError(StatusCodes.CONFLICT, 'Slug already in use');
      }
    }

    if (data.parentId) {
      // Prevent setting parent to self
      if (data.parentId === categoryId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot set category as its own parent');
      }

      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Parent category not found');
      }
    }

    const command = new UpdateCategoryCommand(categoryId, data, channel);
    return command.execute();
  }

  async deleteCategory(channel: connect.Channel, categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    const command = new DeleteCategoryCommand(categoryId, channel);

    try {
      return command.execute();
    } catch (error: any) {
      if (error.message === 'Cannot delete category with products') {
        throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
      }
      throw error;
    }
  }

  // Category Queries
  async getCategoryById(categoryId: string) {
    const query = new GetCategoryByIdQuery(categoryId);
    const category = await query.execute();

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    return category;
  }

  async getCategoryBySlug(slug: string) {
    const query = new GetCategoryBySlugQuery(slug);
    const category = await query.execute();

    if (!category) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }

    return category;
  }

  async listCategories(activeOnly: boolean = true, includeParent: boolean = false) {
    const query = new ListCategoriesQuery(activeOnly, includeParent);
    return query.execute();
  }

  async getCategoryTree() {
    const query = new GetCategoryTreeQuery();
    return query.execute();
  }

  // Cache invalidation helper
  async invalidateProductCache(productId: string) {
    await redis.del(`product:${productId}`);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sku: true, slug: true },
    });
    if (product) {
      await redis.del(`product:sku:${product.sku}`);
      await redis.del(`product:slug:${product.slug}`);
    }
    // Invalidate list caches
    const keys = await redis.keys('products:list:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async invalidateCategoryCache(categoryId: string) {
    await redis.del(`category:${categoryId}`);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });
    if (category) {
      await redis.del(`category:slug:${category.slug}`);
    }
    // Invalidate list and tree caches
    await redis.del('categories:tree');
    const keys = await redis.keys('categories:list:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export default new ProductService();

import { PrismaClient } from '@prisma/client';
import { redis } from '../server';

const prisma = new PrismaClient();

// Query Interface
export interface Query<TResult> {
  execute(): Promise<TResult>;
}

// Cache helper
const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch {
    return null;
  }
};

const setCache = async (key: string, data: any, ttl: number = 3600): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Get Product By ID Query
export class GetProductByIdQuery implements Query<any> {
  constructor(private productId: string) {}

  async execute() {
    const cacheKey = `product:${this.productId}`;

    // Try cache first
    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await prisma.product.findUnique({
      where: { id: this.productId },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (product) {
      // Calculate average rating
      const avgRating = await prisma.productReview.aggregate({
        where: { productId: this.productId, isApproved: true },
        _avg: { rating: true },
      });

      const result = {
        ...product,
        averageRating: avgRating._avg.rating || 0,
        reviewCount: product._count.reviews,
      };

      await setCache(cacheKey, result, 1800); // 30 min cache
      return result;
    }

    return null;
  }
}

// Get Product By SKU Query
export class GetProductBySkuQuery implements Query<any> {
  constructor(private sku: string) {}

  async execute() {
    const cacheKey = `product:sku:${this.sku}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await prisma.product.findUnique({
      where: { sku: this.sku },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (product) {
      await setCache(cacheKey, product, 1800);
    }

    return product;
  }
}

// Get Product By Slug Query
export class GetProductBySlugQuery implements Query<any> {
  constructor(private slug: string) {}

  async execute() {
    const cacheKey = `product:slug:${this.slug}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await prisma.product.findUnique({
      where: { slug: this.slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (product) {
      const avgRating = await prisma.productReview.aggregate({
        where: { productId: product.id, isApproved: true },
        _avg: { rating: true },
      });

      const result = {
        ...product,
        averageRating: avgRating._avg.rating || 0,
        reviewCount: product._count.reviews,
      };

      await setCache(cacheKey, result, 1800);
      return result;
    }

    return null;
  }
}

// List Products Query
export class ListProductsQuery implements Query<{ products: any[]; total: number; page: number; totalPages: number }> {
  constructor(
    private params: {
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
    }
  ) {}

  async execute() {
    const {
      search,
      categoryId,
      status,
      brand,
      isFeatured,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = this.params;

    const skip = (page - 1) * limit;
    const cacheKey = `products:list:${JSON.stringify(this.params)}`;

    // Try cache
    const cached = await getFromCache<{ products: any[]; total: number; page: number; totalPages: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (brand) {
      where.brand = brand;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Get total count
    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    const result = { products, total, page, totalPages };
    await setCache(cacheKey, result, 300); // 5 min cache

    return result;
  }
}

// Get Featured Products Query
export class GetFeaturedProductsQuery implements Query<any[]> {
  constructor(private limit: number = 10) {}

  async execute() {
    const cacheKey = `products:featured:${this.limit}`;

    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        status: 'active',
      },
      take: this.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    await setCache(cacheKey, products, 600); // 10 min cache
    return products;
  }
}

// Get Products By Category Query
export class GetProductsByCategoryQuery implements Query<any[]> {
  constructor(
    private categoryId: string,
    private limit: number = 20
  ) {}

  async execute() {
    const cacheKey = `products:category:${this.categoryId}:${this.limit}`;

    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: this.categoryId,
        status: 'active',
      },
      take: this.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    await setCache(cacheKey, products, 600);
    return products;
  }
}

// Get Category By ID Query
export class GetCategoryByIdQuery implements Query<any> {
  constructor(private categoryId: string) {}

  async execute() {
    const cacheKey = `category:${this.categoryId}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await prisma.category.findUnique({
      where: { id: this.categoryId },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (category) {
      await setCache(cacheKey, category, 3600);
    }

    return category;
  }
}

// Get Category By Slug Query
export class GetCategoryBySlugQuery implements Query<any> {
  constructor(private slug: string) {}

  async execute() {
    const cacheKey = `category:slug:${this.slug}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await prisma.category.findUnique({
      where: { slug: this.slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (category) {
      await setCache(cacheKey, category, 3600);
    }

    return category;
  }
}

// List Categories Query
export class ListCategoriesQuery implements Query<any[]> {
  constructor(
    private activeOnly: boolean = true,
    private includeParent: boolean = false
  ) {}

  async execute() {
    const cacheKey = `categories:list:${this.activeOnly}:${this.includeParent}`;

    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (this.activeOnly) {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: this.includeParent,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    await setCache(cacheKey, categories, 3600);
    return categories;
  }
}

// Get Category Tree Query
export class GetCategoryTreeQuery implements Query<any[]> {
  constructor() {}

  async execute() {
    const cacheKey = 'categories:tree';

    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Get all active categories
    const allCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          productCount: cat._count.products,
          children: buildTree(cat.id),
        }));
    };

    const tree = buildTree();
    await setCache(cacheKey, tree, 3600);
    return tree;
  }
}

// Get Product Reviews Query
export class GetProductReviewsQuery implements Query<any[]> {
  constructor(
    private productId: string,
    private page: number = 1,
    private limit: number = 10
  ) {}

  async execute() {
    const skip = (this.page - 1) * this.limit;
    const cacheKey = `reviews:${this.productId}:${this.page}:${this.limit}`;

    const cached = await getFromCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const reviews = await prisma.productReview.findMany({
      where: {
        productId: this.productId,
        isApproved: true,
      },
      skip,
      take: this.limit,
      orderBy: { createdAt: 'desc' },
    });

    await setCache(cacheKey, reviews, 600);
    return reviews;
  }
}

// Search Products Query (full-text search)
export class SearchProductsQuery implements Query<{ products: any[]; total: number }> {
  constructor(
    private query: string,
    private page: number = 1,
    private limit: number = 20
  ) {}

  async execute() {
    const skip = (this.page - 1) * this.limit;
    const cacheKey = `search:${this.query}:${this.page}:${this.limit}`;

    const cached = await getFromCache<{ products: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where = {
      status: 'active',
      OR: [
        { name: { contains: this.query, mode: 'insensitive' } },
        { description: { contains: this.query, mode: 'insensitive' } },
        { brand: { contains: this.query, mode: 'insensitive' } },
        { tags: { has: this.query } },
      ],
    };

    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      skip,
      take: this.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    const result = { products, total };
    await setCache(cacheKey, result, 300);
    return result;
  }
}

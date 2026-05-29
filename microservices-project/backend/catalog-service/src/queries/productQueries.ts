import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { redis } from '../server';

// =========================
// QUERY INTERFACE
// =========================
export interface Query<TResult> {
  execute(): Promise<TResult>;
}

// =========================
// CACHE HELPERS
// =========================
const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  } catch {
    return null;
  }
};

const setCache = async (key: string, data: any, ttl = 3600): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

// =========================
// GET PRODUCT BY ID
// =========================
export class GetProductByIdQuery implements Query<any> {
  constructor(private productId: string) {}

  async execute() {
    const cacheKey = `product:${this.productId}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id: this.productId },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) return null;

    const avgRating = await prisma.productReview.aggregate({
      where: { productId: this.productId, isApproved: true },
      _avg: { rating: true },
    });

    const result = {
      ...product,
      averageRating: avgRating._avg.rating || 0,
      reviewCount: product._count.reviews,
    };

    await setCache(cacheKey, result);
    return result;
  }
}

// =========================
// GET PRODUCT BY SKU
// =========================
export class GetProductBySkuQuery implements Query<any> {
  constructor(private sku: string) {}

  async execute() {
    const cacheKey = `product:sku:${this.sku}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { sku: this.sku },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) return null;

    const avgRating = await prisma.productReview.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
    });

    const result = {
      ...product,
      averageRating: avgRating._avg.rating || 0,
      reviewCount: product._count.reviews,
    };

    await setCache(cacheKey, result);
    return result;
  }
}

// =========================
// GET PRODUCT BY SLUG
// =========================
export class GetProductBySlugQuery implements Query<any> {
  constructor(private slug: string) {}

  async execute() {
    const cacheKey = `product:slug:${this.slug}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { slug: this.slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) return null;

    const avgRating = await prisma.productReview.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
    });

    const result = {
      ...product,
      averageRating: avgRating._avg.rating || 0,
      reviewCount: product._count.reviews,
    };

    await setCache(cacheKey, result);
    return result;
  }
}

// =========================
// LIST PRODUCTS
// =========================
export class ListProductsQuery implements Query<any> {
  constructor(private params: any) {}

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

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (brand) where.brand = brand;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: true } },
      },
    });

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

// =========================
// SEARCH PRODUCTS
// =========================
export class SearchProductsQuery implements Query<any> {
  constructor(
    private query: string,
    private page = 1,
    private limit = 20
  ) {}

  async execute() {
    const skip = (this.page - 1) * this.limit;

    const where: Prisma.ProductWhereInput = {
      status: 'active',
      OR: [
        { name: { contains: this.query, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: this.query, mode: Prisma.QueryMode.insensitive } },
        { brand: { contains: this.query, mode: Prisma.QueryMode.insensitive } },
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
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    return { products, total };
  }
}

// =========================
// GET FEATURED PRODUCTS
// =========================
export class GetFeaturedProductsQuery implements Query<any> {
  constructor(private limit = 10) {}

  async execute() {
    const cacheKey = `products:featured:${this.limit}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: { isFeatured: true, status: 'active' },
      take: this.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: true } },
      },
    });

    await setCache(cacheKey, products, 1800);
    return products;
  }
}

// =========================
// GET PRODUCTS BY CATEGORY
// =========================
export class GetProductsByCategoryQuery implements Query<any> {
  constructor(
    private categoryId: string,
    private page = 1,
    private limit = 20
  ) {}

  async execute() {
    const skip = (this.page - 1) * this.limit;

    const where: Prisma.ProductWhereInput = {
      categoryId: this.categoryId,
      status: 'active',
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: this.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page: this.page,
      totalPages: Math.ceil(total / this.limit),
    };
  }
}

// =========================
// GET CATEGORY BY ID
// =========================
export class GetCategoryByIdQuery implements Query<any> {
  constructor(private categoryId: string) {}

  async execute() {
    const cacheKey = `category:${this.categoryId}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const category = await prisma.category.findUnique({
      where: { id: this.categoryId },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) return null;

    await setCache(cacheKey, category);
    return category;
  }
}

// =========================
// GET CATEGORY BY SLUG
// =========================
export class GetCategoryBySlugQuery implements Query<any> {
  constructor(private slug: string) {}

  async execute() {
    const cacheKey = `category:slug:${this.slug}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const category = await prisma.category.findUnique({
      where: { slug: this.slug },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) return null;

    await setCache(cacheKey, category);
    return category;
  }
}

// =========================
// LIST CATEGORIES
// =========================
export class ListCategoriesQuery implements Query<any> {
  constructor(
    private isActive?: boolean,
    private includeParent?: boolean  // era string | null, mas o service passa boolean
  ) {}

  async execute() {
    const cacheKey = `categories:${this.isActive}:${this.includeParent}`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.CategoryWhereInput = {};

    if (this.isActive !== undefined) where.isActive = this.isActive;

    // se includeParent = false, filtra só categorias raiz (sem pai)
    if (this.includeParent === false) where.parentId = null;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        parent: this.includeParent ? true : false,
        children: true,
        _count: { select: { products: true, children: true } },
      },
    });

    await setCache(cacheKey, categories, 1800);
    return categories;
  }
}

// =========================
// GET CATEGORY TREE
// =========================
export class GetCategoryTreeQuery implements Query<any> {
  async execute() {
    const cacheKey = `categories:tree`;

    const cached = await getFromCache<any>(cacheKey);
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          include: {
            children: { where: { isActive: true }, orderBy: { name: 'asc' } },
          },
        },
      },
    });

    const tree = categories.filter((c) => c.parentId === null);

    await setCache(cacheKey, tree, 3600);
    return tree;
  }
}

// =========================
// GET PRODUCT REVIEWS
// =========================
export class GetProductReviewsQuery implements Query<any> {
  constructor(
    private productId: string,
    private page = 1,
    private limit = 10
  ) {}

  async execute() {
    const skip = (this.page - 1) * this.limit;

    const where: Prisma.ProductReviewWhereInput = {
      productId: this.productId,
      isApproved: true,
    };

    const [reviews, total, aggregate] = await Promise.all([
      prisma.productReview.findMany({
        where,
        skip,
        take: this.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productReview.count({ where }),
      prisma.productReview.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      reviews,
      total,
      page: this.page,
      totalPages: Math.ceil(total / this.limit),
      averageRating: aggregate._avg.rating || 0,
    };
  }
}
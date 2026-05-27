import { PrismaClient } from '@prisma/client';
import { publishEvent } from '../config/rabbitmq';
import connect from 'amqplib';

const prisma = new PrismaClient();

// Command Interface
export interface Command {
  execute(): Promise<any>;
}

// Create Product Command
export class CreateProductCommand implements Command {
  constructor(
    private data: {
      sku: string;
      name: string;
      slug: string;
      description?: string;
      shortDescription?: string;
      price: number;
      comparePrice?: number;
      costPrice?: number;
      quantity?: number;
      categoryId: string;
      brand?: string;
      status?: string;
      isFeatured?: boolean;
      isDigital?: boolean;
      weight?: number;
      dimensions?: any;
      metaTitle?: string;
      metaDescription?: string;
      tags?: string[];
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const product = await prisma.product.create({
      data: {
        ...this.data,
        price: this.data.price,
        comparePrice: this.data.comparePrice,
        costPrice: this.data.costPrice,
        weight: this.data.weight,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    // Publish event
    await publishEvent(this.channel, 'product.created', {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      timestamp: new Date().toISOString(),
    });

    return product;
  }
}

// Update Product Command
export class UpdateProductCommand implements Command {
  constructor(
    private productId: string,
    private data: {
      sku?: string;
      name?: string;
      slug?: string;
      description?: string;
      shortDescription?: string;
      price?: number;
      comparePrice?: number;
      costPrice?: number;
      quantity?: number;
      categoryId?: string;
      brand?: string;
      status?: string;
      isFeatured?: boolean;
      isDigital?: boolean;
      weight?: number;
      dimensions?: any;
      metaTitle?: string;
      metaDescription?: string;
      tags?: string[];
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const product = await prisma.product.update({
      where: { id: this.productId },
      data: {
        ...this.data,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    // Publish event
    await publishEvent(this.channel, 'product.updated', {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      changes: Object.keys(this.data),
      timestamp: new Date().toISOString(),
    });

    return product;
  }
}

// Delete Product Command
export class DeleteProductCommand implements Command {
  constructor(
    private productId: string,
    private channel: connect.Channel
  ) {}

  async execute() {
    const product = await prisma.product.findUnique({
      where: { id: this.productId },
    });

    if (!product) {
      return null;
    }

    await prisma.product.delete({
      where: { id: this.productId },
    });

    // Publish event
    await publishEvent(this.channel, 'product.deleted', {
      productId: this.productId,
      sku: product.sku,
      timestamp: new Date().toISOString(),
    });

    return { success: true, productId: this.productId };
  }
}

// Create Product Image Command
export class CreateProductImageCommand implements Command {
  constructor(
    private data: {
      productId: string;
      url: string;
      altText?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    // If setting as primary, unset other primary images
    if (this.data.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: this.data.productId },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: this.data,
    });

    await publishEvent(this.channel, 'product.image.created', {
      productId: this.data.productId,
      imageId: image.id,
      timestamp: new Date().toISOString(),
    });

    return image;
  }
}

// Delete Product Image Command
export class DeleteProductImageCommand implements Command {
  constructor(
    private imageId: string,
    private channel: connect.Channel
  ) {}

  async execute() {
    const image = await prisma.productImage.findUnique({
      where: { id: this.imageId },
    });

    if (!image) {
      return null;
    }

    await prisma.productImage.delete({
      where: { id: this.imageId },
    });

    await publishEvent(this.channel, 'product.image.deleted', {
      productId: image.productId,
      imageId: this.imageId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, imageId: this.imageId };
  }
}

// Create Product Variant Command
export class CreateProductVariantCommand implements Command {
  constructor(
    private data: {
      productId: string;
      sku: string;
      name: string;
      price: number;
      comparePrice?: number;
      quantity?: number;
      attributes?: any;
      isActive?: boolean;
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const variant = await prisma.productVariant.create({
      data: this.data,
    });

    await publishEvent(this.channel, 'product.variant.created', {
      productId: this.data.productId,
      variantId: variant.id,
      sku: variant.sku,
      timestamp: new Date().toISOString(),
    });

    return variant;
  }
}

// Update Product Variant Command
export class UpdateProductVariantCommand implements Command {
  constructor(
    private variantId: string,
    private data: {
      sku?: string;
      name?: string;
      price?: number;
      comparePrice?: number;
      quantity?: number;
      attributes?: any;
      isActive?: boolean;
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const variant = await prisma.productVariant.update({
      where: { id: this.variantId },
      data: {
        ...this.data,
        updatedAt: new Date(),
      },
    });

    await publishEvent(this.channel, 'product.variant.updated', {
      productId: variant.productId,
      variantId: this.variantId,
      timestamp: new Date().toISOString(),
    });

    return variant;
  }
}

// Delete Product Variant Command
export class DeleteProductVariantCommand implements Command {
  constructor(
    private variantId: string,
    private channel: connect.Channel
  ) {}

  async execute() {
    const variant = await prisma.productVariant.findUnique({
      where: { id: this.variantId },
    });

    if (!variant) {
      return null;
    }

    await prisma.productVariant.delete({
      where: { id: this.variantId },
    });

    await publishEvent(this.channel, 'product.variant.deleted', {
      productId: variant.productId,
      variantId: this.variantId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, variantId: this.variantId };
  }
}

// Create Category Command
export class CreateCategoryCommand implements Command {
  constructor(
    private data: {
      name: string;
      slug: string;
      description?: string;
      imageUrl?: string;
      parentId?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const category = await prisma.category.create({
      data: this.data,
      include: {
        parent: true,
        children: true,
      },
    });

    await publishEvent(this.channel, 'category.created', {
      categoryId: category.id,
      slug: category.slug,
      timestamp: new Date().toISOString(),
    });

    return category;
  }
}

// Update Category Command
export class UpdateCategoryCommand implements Command {
  constructor(
    private categoryId: string,
    private data: {
      name?: string;
      slug?: string;
      description?: string;
      imageUrl?: string;
      parentId?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
    private channel: connect.Channel
  ) {}

  async execute() {
    const category = await prisma.category.update({
      where: { id: this.categoryId },
      data: {
        ...this.data,
        updatedAt: new Date(),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    await publishEvent(this.channel, 'category.updated', {
      categoryId: this.categoryId,
      slug: category.slug,
      timestamp: new Date().toISOString(),
    });

    return category;
  }
}

// Delete Category Command
export class DeleteCategoryCommand implements Command {
  constructor(
    private categoryId: string,
    private channel: connect.Channel
  ) {}

  async execute() {
    const category = await prisma.category.findUnique({
      where: { id: this.categoryId },
    });

    if (!category) {
      return null;
    }

    // Check for products in this category
    const productCount = await prisma.product.count({
      where: { categoryId: this.categoryId },
    });

    if (productCount > 0) {
      throw new Error('Cannot delete category with products');
    }

    await prisma.category.delete({
      where: { id: this.categoryId },
    });

    await publishEvent(this.channel, 'category.deleted', {
      categoryId: this.categoryId,
      slug: category.slug,
      timestamp: new Date().toISOString(),
    });

    return { success: true, categoryId: this.categoryId };
  }
}

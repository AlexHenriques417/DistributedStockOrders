import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Distributed Stock Orders API',
      version: '1.0.0',
      description: 'API Gateway Documentation',
    },

    servers: [
      {
        url: 'http://localhost:3000',
        description: 'API Gateway',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],

    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Products' },
      { name: 'Categories' },
      { name: 'Inventory' },
      { name: 'Orders' },
      { name: 'Payments' },
    ],

    paths: {
      /* ================= AUTH ================= */

      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register user',
        },
      },

      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
        },
      },

      '/api/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh token',
        },
      },

      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
        },
      },

      /* ================= USERS ================= */

      '/api/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get profile',
        },
        put: {
          tags: ['Users'],
          summary: 'Update profile',
        },
      },

      '/api/users/change-password': {
        post: {
          tags: ['Users'],
          summary: 'Change password',
        },
      },

      '/api/users/addresses': {
        get: {
          tags: ['Users'],
          summary: 'List addresses',
        },
        post: {
          tags: ['Users'],
          summary: 'Create address',
        },
      },

      '/api/users/addresses/{addressId}': {
        put: {
          tags: ['Users'],
          summary: 'Update address',
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete address',
        },
      },

      '/api/users/preferences': {
        get: {
          tags: ['Users'],
          summary: 'Get preferences',
        },
        put: {
          tags: ['Users'],
          summary: 'Update preferences',
        },
      },

      /* ================= PRODUCTS ================= */

      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'List products',
        },
        post: {
          tags: ['Products'],
          summary: 'Create product',
        },
      },

      '/api/products/search': {
        get: {
          tags: ['Products'],
          summary: 'Search products',
        },
      },

      '/api/products/featured': {
        get: {
          tags: ['Products'],
          summary: 'Featured products',
        },
      },

      '/api/products/{productId}': {
        get: {
          tags: ['Products'],
          summary: 'Get product',
        },
        put: {
          tags: ['Products'],
          summary: 'Update product',
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product',
        },
      },

      '/api/products/{productId}/reviews': {
        get: {
          tags: ['Products'],
          summary: 'List reviews',
        },
        post: {
          tags: ['Products'],
          summary: 'Create review',
        },
      },

      /* ================= CATEGORIES ================= */

      '/api/categories': {
        get: {
          tags: ['Categories'],
          summary: 'List categories',
        },
        post: {
          tags: ['Categories'],
          summary: 'Create category',
        },
      },

      '/api/categories/tree': {
        get: {
          tags: ['Categories'],
          summary: 'Category tree',
        },
      },

      '/api/categories/{categoryId}': {
        get: {
          tags: ['Categories'],
          summary: 'Get category',
        },
        put: {
          tags: ['Categories'],
          summary: 'Update category',
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete category',
        },
      },

      /* ================= INVENTORY ================= */

      '/api/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'List inventory',
        },
        post: {
          tags: ['Inventory'],
          summary: 'Create inventory item',
        },
      },

      '/api/inventory/{itemId}': {
        get: {
          tags: ['Inventory'],
          summary: 'Get inventory item',
        },
        put: {
          tags: ['Inventory'],
          summary: 'Update inventory item',
        },
      },

      '/api/inventory/{itemId}/adjust': {
        post: {
          tags: ['Inventory'],
          summary: 'Adjust stock',
        },
      },

      '/api/inventory/{itemId}/reserve': {
        post: {
          tags: ['Inventory'],
          summary: 'Reserve stock',
        },
      },

      '/api/inventory/{itemId}/release': {
        post: {
          tags: ['Inventory'],
          summary: 'Release stock',
        },
      },

      '/api/inventory/{itemId}/confirm': {
        post: {
          tags: ['Inventory'],
          summary: 'Confirm stock',
        },
      },

      '/api/inventory/{itemId}/transfer': {
        post: {
          tags: ['Inventory'],
          summary: 'Transfer stock',
        },
      },

      /* ================= ORDERS ================= */

      '/api/orders': {
        get: {
          tags: ['Orders'],
          summary: 'List orders',
        },
        post: {
          tags: ['Orders'],
          summary: 'Create order',
        },
      },

      '/api/orders/{orderId}': {
        get: {
          tags: ['Orders'],
          summary: 'Get order',
        },
      },

      '/api/orders/{orderId}/status': {
        put: {
          tags: ['Orders'],
          summary: 'Update order status',
        },
      },

      '/api/orders/{orderId}/cancel': {
        post: {
          tags: ['Orders'],
          summary: 'Cancel order',
        },
      },

      '/api/orders/checkout': {
        post: {
          tags: ['Orders'],
          summary: 'Checkout',
        },
      },

      '/api/orders/cart/items': {
        get: {
          tags: ['Orders'],
          summary: 'Get cart',
        },
        post: {
          tags: ['Orders'],
          summary: 'Add cart item',
        },
      },

      /* ================= PAYMENTS ================= */

      '/api/payments/process': {
        post: {
          tags: ['Payments'],
          summary: 'Process payment',
        },
      },

      '/api/payments': {
        get: {
          tags: ['Payments'],
          summary: 'List payments',
        },
      },

      '/api/payments/user': {
        get: {
          tags: ['Payments'],
          summary: 'User payments',
        },
      },

      '/api/payments/order/{orderId}': {
        get: {
          tags: ['Payments'],
          summary: 'Payment by order',
        },
      },

      '/api/payments/refund': {
        post: {
          tags: ['Payments'],
          summary: 'Refund payment',
        },
      },

      '/api/payments/{paymentId}/cancel': {
        post: {
          tags: ['Payments'],
          summary: 'Cancel payment',
        },
      },
    },
  },

  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
};
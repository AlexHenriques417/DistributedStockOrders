import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'E-commerce API Gateway',
      version: '1.0.0',
      description: 'Swagger unificado dos microsserviços: Catalog, Inventory, Orders, Payments e Users',
    },

    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'API Gateway',
      },
    ],

    security: [{ bearerAuth: [] }],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },

        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            stock: { type: 'number' },
          },
        },

        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            productId: { type: 'string' },
            quantity: { type: 'number' },
            reserved: { type: 'number' },
          },
        },

        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            total: { type: 'number' },
          },
        },

        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderId: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string' },
          },
        },

        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },

    tags: [
      { name: 'Auth', description: 'Autenticação' },
      { name: 'Users', description: 'Usuários' },
      { name: 'Catalog', description: 'Catálogo' },
      { name: 'Inventory', description: 'Estoque' },
      { name: 'Orders', description: 'Pedidos' },
      { name: 'Cart', description: 'Carrinho' },
      { name: 'Payments', description: 'Pagamentos' },
    ],

    paths: {
      /* ================= AUTH ================= */

      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar usuário',
          responses: { 201: { description: 'Usuário criado' } },
        },
      },

      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          responses: {
            200: {
              description: 'Autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },

      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh token',
          responses: { 200: { description: 'Token renovado' } },
        },
      },

      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          responses: { 204: { description: 'Logout realizado' } },
        },
      },

      /* ================= USERS ================= */

      '/api/users/me': {
        get: {
          tags: ['Users'],
          summary: 'Perfil do usuário',
          responses: {
            200: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Atualizar perfil',
          responses: { 200: { description: 'Perfil atualizado' } },
        },
      },

      /* ================= CATALOG ================= */

      '/api/catalog': {
        get: {
          tags: ['Catalog'],
          summary: 'Listar produtos',
          responses: {
            200: {
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Catalog'],
          summary: 'Criar produto (admin/manager)',
          responses: { 201: { description: 'Produto criado' } },
        },
      },

      '/api/catalog/{productId}': {
        get: {
          tags: ['Catalog'],
          summary: 'Buscar produto por ID',
          parameters: [{ name: 'productId', in: 'path', required: true }],
          responses: { 200: { description: 'Produto encontrado' } },
        },
        put: {
          tags: ['Catalog'],
          summary: 'Atualizar produto',
          parameters: [{ name: 'productId', in: 'path', required: true }],
          responses: { 200: { description: 'Produto atualizado' } },
        },
        delete: {
          tags: ['Catalog'],
          summary: 'Deletar produto (admin)',
          parameters: [{ name: 'productId', in: 'path', required: true }],
          responses: { 204: { description: 'Produto removido' } },
        },
      },

      /* ================= INVENTORY ================= */

      '/api/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'Listar estoque',
          responses: { 200: { description: 'Itens de estoque' } },
        },
        post: {
          tags: ['Inventory'],
          summary: 'Criar item de estoque',
          responses: { 201: { description: 'Item criado' } },
        },
      },

      '/api/inventory/{itemId}/adjust': {
        post: {
          tags: ['Inventory'],
          summary: 'Ajustar estoque',
          parameters: [{ name: 'itemId', in: 'path', required: true }],
          responses: { 200: { description: 'Estoque ajustado' } },
        },
      },

      /* ================= ORDERS ================= */

      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Criar pedido',
          responses: { 201: { description: 'Pedido criado' } },
        },
        get: {
          tags: ['Orders'],
          summary: 'Listar pedidos do usuário',
          responses: { 200: { description: 'Lista de pedidos' } },
        },
      },

      '/api/orders/{orderId}/cancel': {
        post: {
          tags: ['Orders'],
          summary: 'Cancelar pedido',
          parameters: [{ name: 'orderId', in: 'path', required: true }],
          responses: { 200: { description: 'Pedido cancelado' } },
        },
      },

      /* ================= CART ================= */

      '/api/orders/cart/items': {
        get: {
          tags: ['Cart'],
          summary: 'Itens do carrinho',
          responses: { 200: { description: 'Carrinho' } },
        },
        post: {
          tags: ['Cart'],
          summary: 'Adicionar item ao carrinho',
          responses: { 201: { description: 'Item adicionado' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Limpar carrinho',
          responses: { 204: { description: 'Carrinho limpo' } },
        },
      },

      /* ================= PAYMENTS ================= */

      '/api/payments/process': {
        post: {
          tags: ['Payments'],
          summary: 'Processar pagamento',
          responses: { 201: { description: 'Pagamento processado' } },
        },
      },

      '/api/payments/{paymentId}/cancel': {
        post: {
          tags: ['Payments'],
          summary: 'Cancelar pagamento',
          parameters: [{ name: 'paymentId', in: 'path', required: true }],
          responses: { 200: { description: 'Pagamento cancelado' } },
        },
      },
    },
  },

  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
import 'dotenv/config';
import express, { Request, Response } from 'express';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

const CATALOG_URL   = process.env.CATALOG_SERVICE_URL   || 'http://localhost:3001';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
const ORDER_URL     = process.env.ORDER_SERVICE_URL     || 'http://localhost:3003';
const PAYMENT_URL   = process.env.PAYMENT_SERVICE_URL   || 'http://localhost:3004';
const USER_URL      = process.env.USER_SERVICE_URL      || 'http://localhost:3005';

// --- MIDDLEWARES GLOBAIS ---
app.use(morgan('combined'));
app.use(express.json());

// --- HEALTH CHECK DO GATEWAY ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    routes: {
      catalog:   `${CATALOG_URL}/catalog`,
      inventory: `${INVENTORY_URL}/inventory`,
      orders:    `${ORDER_URL}/order`,
      payments:  `${PAYMENT_URL}/payment`,
      users:     `${USER_URL}/user`,
    }
  });
});

// --- ROTAS PÚBLICAS (sem autenticação) ---
// Registro e login de usuários
app.use('/api/users', proxy(USER_URL, {
  proxyReqPathResolver: (req) => `/user${req.url}`
}));

// --- ROTAS PROTEGIDAS (requerem JWT) ---
app.use('/api/catalog', authMiddleware, proxy(CATALOG_URL, {
  proxyReqPathResolver: (req) => `/catalog${req.url}`
}));

app.use('/api/inventory', authMiddleware, proxy(INVENTORY_URL, {
  proxyReqPathResolver: (req) => `/inventory${req.url}`
}));

app.use('/api/orders', authMiddleware, proxy(ORDER_URL, {
  proxyReqPathResolver: (req) => `/order${req.url}`
}));

app.use('/api/payments', authMiddleware, proxy(PAYMENT_URL, {
  proxyReqPathResolver: (req) => `/payment${req.url}`
}));

// --- FALLBACK ---
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada no API Gateway' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 API Gateway rodando na porta ${PORT}`);
  console.log(`🔐 Rotas públicas:   POST /api/users, GET /api/users`);
  console.log(`🔒 Rotas protegidas: /api/catalog, /api/inventory, /api/orders, /api/payments`);
});

export default app;

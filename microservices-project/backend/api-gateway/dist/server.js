"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_http_proxy_1 = __importDefault(require("express-http-proxy"));
const morgan_1 = __importDefault(require("morgan"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:3005';
// --- MIDDLEWARES GLOBAIS ---
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
});
// --- HEALTH CHECK DO GATEWAY ---
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        service: 'API Gateway',
        routes: {
            catalog: `${CATALOG_URL}/catalog`,
            inventory: `${INVENTORY_URL}/inventory`,
            orders: `${ORDER_URL}/order`,
            payments: `${PAYMENT_URL}/payment`,
            users: `${USER_URL}/user`,
        }
    });
});
// --- ROTAS PÚBLICAS (sem autenticação) ---
// Registro e login de usuários
app.use('/api/users', (0, express_http_proxy_1.default)(USER_URL, {
    proxyReqPathResolver: (req) => `/user${req.url}`
}));
// --- ROTAS PROTEGIDAS (requerem JWT) ---
app.use('/api/catalog', auth_middleware_1.authMiddleware, (0, express_http_proxy_1.default)(CATALOG_URL, {
    proxyReqPathResolver: (req) => `/catalog${req.url}`
}));
app.use('/api/inventory', auth_middleware_1.authMiddleware, (0, express_http_proxy_1.default)(INVENTORY_URL, {
    proxyReqPathResolver: (req) => `/inventory${req.url}`
}));
app.use('/api/orders', auth_middleware_1.authMiddleware, (0, express_http_proxy_1.default)(ORDER_URL, {
    proxyReqPathResolver: (req) => `/order${req.url}`
}));
app.use('/api/payments', auth_middleware_1.authMiddleware, (0, express_http_proxy_1.default)(PAYMENT_URL, {
    proxyReqPathResolver: (req) => `/payment${req.url}`
}));
// --- FALLBACK ---
app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada no API Gateway' });
});
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 API Gateway rodando na porta ${PORT}`);
    console.log(`🔐 Rotas públicas:   POST /api/users, GET /api/users`);
    console.log(`🔒 Rotas protegidas: /api/catalog, /api/inventory, /api/orders, /api/payments`);
});
exports.default = app;

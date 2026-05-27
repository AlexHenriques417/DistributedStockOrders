"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const database_1 = __importDefault(require("./config/database"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const swaggerDocument = require(path_1.default.resolve(__dirname, './docs/swagger.json'));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
});
app.use('/user', user_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'User Service' });
});
async function bootstrap() {
    try {
        await database_1.default.authenticate();
        console.log('✅ Conexão com o Banco de Dados (User DB) OK.');
        await database_1.default.sync({ alter: true });
        app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`🚀 User Service rodando em: http://localhost:${PORT}`);
            console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
        });
    }
    catch (error) {
        console.error('❌ Erro ao iniciar o User Service:', error);
        process.exit(1);
    }
}
// Só sobe o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
    bootstrap();
}
exports.default = app;

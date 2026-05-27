import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import userRoutes from './routes/user.routes';

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/user', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'User Service' });
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o Banco de Dados (User DB) OK.');
    await sequelize.sync({ alter: true });

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 User Service rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o User Service:', error);
    process.exit(1);
  }
}

// Só sobe o servidor se não estiver em modo de teste
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;
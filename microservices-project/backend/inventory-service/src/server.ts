import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database'; 
// Supondo que você já tenha as rotas criadas, se não tiver, comente a linha abaixo 
import inventoryRoutes from './routes/inventory.routes';

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));

const app = express();
const PORT = process.env.PORT || 3002; // Note que a porta é 3002

app.use(express.json());

// Rota do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Inventory Service' });
});

app.use('/inventory', inventoryRoutes);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('✅ Inventário: Conexão com DB OK.');
    await sequelize.sync({ alter: true });

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Inventory rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Erro no Inventory Service:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;
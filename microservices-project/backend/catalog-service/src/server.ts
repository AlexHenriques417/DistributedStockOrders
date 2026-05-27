import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import catalogRoutes from './routes/catalog.routes';
import { ProductCacheService } from './cache/ProductCacheService';

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/docs',     swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Catalog Service' });
});

// AULA 09: endpoint de monitoramento do cache Redis
app.get('/catalog/cache/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await new ProductCacheService().getStats();
    res.json({ service: 'Catalog Cache Stats', stats });
  } catch {
    res.status(500).json({ error: 'Erro ao obter stats do Redis' });
  }
});

app.use('/catalog', catalogRoutes);

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('Conexao com PostgreSQL estabelecida.');
    await sequelize.sync({ alter: true });
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Catalog Service: http://localhost:${PORT}`);
      console.log(`Cache Stats:     http://localhost:${PORT}/catalog/cache/stats`);
    });
  } catch (error) {
    console.error('Erro critico:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') bootstrap();
export default app;

//Observalidade e Resiliencia
import 'dotenv/config';
import http from 'http';
import express, { Request, Response } from 'express';
import sequelize from './config/database';
import inventoryRoutes from './routes/inventory.routes';
import { InventoryGateway } from './gateway/InventoryGateway';

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use('/inventory', inventoryRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Inventory Service' });
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Inventory Service: DB conectado.');

    const gateway = new InventoryGateway(httpServer);

    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Inventory Service HTTP: http://localhost:${PORT}`);
      console.log(`Inventory Service WS:   ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro no Inventory Service:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') bootstrap();
export { app, httpServer };

//Observalidade e Resiliencia
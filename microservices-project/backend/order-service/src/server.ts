import 'dotenv/config';
import http from 'http';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import orderRoutes from './routes/order.routes';
import { OrderConsumer } from './consumers/OrderConsumer';
import { OrderGateway } from './gateway/OrderGateway';

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));
const app        = express();
// AULA 10: http.createServer e obrigatorio — Socket.io precisa do servidor HTTP
const httpServer = http.createServer(app);
const PORT       = process.env.PORT || 3003;

app.use(express.json());
app.use('/order',    orderRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Order Service' });
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Order Service: DB conectado.');

    // AULA 10: gateway antes do consumer para poder passar como dependencia
    const gateway = new OrderGateway(httpServer);

    try {
      const consumer = new OrderConsumer(gateway);
      await consumer.listen();
      console.log('Order Consumer iniciado.');
    } catch (err) {
      console.warn('RabbitMQ indisponivel, consumer nao iniciado:', err);
    }

    // AULA 10: httpServer.listen em vez de app.listen
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Order Service HTTP: http://localhost:${PORT}`);
      console.log(`Order Service WS:   ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro no Order Service:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') bootstrap();
export { app, httpServer };
export default app;
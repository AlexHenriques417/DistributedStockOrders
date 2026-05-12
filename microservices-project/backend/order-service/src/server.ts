import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database';
import orderRoutes from './routes/order.routes';
import { OrderConsumer } from './consumers/OrderConsumer';

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));

const app  = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.use('/order', orderRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Order Service', architecture: 'CQRS + Eventual Consistency' });
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('✅ Order Service: Conexão com DB estabelecida.');
    await sequelize.sync({ alter: true });

    // Inicia o consumer para consistência eventual
    // (escuta payment.approved e payment.refused para atualizar status do pedido)
    try {
      const consumer = new OrderConsumer();
      await consumer.listen();
      console.log('✅ Order Consumer (consistência eventual) iniciado.');
    } catch (err) {
      console.warn('⚠️ RabbitMQ indisponível, consumer não iniciado:', err);
    }

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Order Service rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Erro no Order Service:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;

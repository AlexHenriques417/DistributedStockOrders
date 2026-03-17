import 'reflect-metadata';
import express from 'express';
import sequelize from './config/database';
import orderRoutes from './routes/order.routes';

const app = express();
app.use(express.json());

app.use('/orders', orderRoutes);

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    app.listen(3003, () => {
      console.log('🛒 Order Service rodando na porta 3003');
    });
  } catch (err) {
    console.error('❌ Erro no Order Service:', err);
  }
}

start();
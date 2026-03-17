import 'dotenv/config';
import express from 'express';
import sequelize from './config/database';
import { InventoryConsumer } from './consumers/InventoryConsumer';

const app = express();
app.use(express.json());

const consumer = new InventoryConsumer();

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Banco do Inventory conectado.');

    // Inicia a escuta de mensagens do RabbitMQ
    await consumer.listen();

    app.listen(3002, () => {
      console.log('🚀 Inventory Service rodando na porta 3002');
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar Inventory Service', err);
  }
}

start();
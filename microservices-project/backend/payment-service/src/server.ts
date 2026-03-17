import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import sequelize from './config/database';
import { PaymentConsumer } from './consumers/PaymentConsumer';

const app = express();
app.use(express.json());

const consumer = new PaymentConsumer();

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Banco do Payment conectado.');

    // Inicia o "escutador" de mensagens
    await consumer.listen();

    // Porta 3004 (seguindo a sequência)
    app.listen(3004, () => {
      console.log('💰 Payment Service rodando na porta 3004');
    });
  } catch (err) {
    console.error('❌ Erro no Payment Service:', err);
  }
}

start();
import 'reflect-metadata';
import express from 'express';
import sequelize from './config/database';
import userRoutes from './routes/user.routes';

const app = express();
app.use(express.json());

app.use('/users', userRoutes);

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    app.listen(3005, () => {
      console.log('👤 User Service rodando na porta 3005');
    });
  } catch (err) {
    console.error('❌ Erro no User Service:', err);
  }
}

start();
/*Server princiapl*/
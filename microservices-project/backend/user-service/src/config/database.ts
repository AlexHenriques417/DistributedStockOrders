import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'user_db', 
  models: [User], // Importação direta é mais segura
  logging: false,
});

export default sequelize;
import { Sequelize } from 'sequelize-typescript';
import path from 'path';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'payment_db', 
  
  models: [path.join(__dirname, '..', 'models')],
  
  logging: false,
  
  // REMOVA OU COMENTE AS LINHAS ABAIXO:
  /* modelMatch: (filename, member) => {
    return filename.substring(0, filename.indexOf('.')).toLowerCase() === member.toLowerCase();
  },
  */
});

export default sequelize;
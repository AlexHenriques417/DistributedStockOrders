import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database'; 

const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));

const app = express();
const PORT = process.env.PORT || 3004; // Porta padrão do Payment Service é 3004

app.use(express.json());

// Rota do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Payment Service' });
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('✅ Payment Service: Conexão com DB OK.');
    await sequelize.sync({ alter: true });

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Payment Service rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Erro no Payment Service:', error);
    process.exit(1);
  }
}

bootstrap();
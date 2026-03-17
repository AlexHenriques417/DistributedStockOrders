import 'dotenv/config';
import express, { Request, Response } from 'express';
import sequelize from './config/database'; // Importa a conexão que criamos antes
import catalogRoutes from './routes/catalog.routes'; // Importa as rotas

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para entender JSON no corpo das requisições
app.use(express.json());

// Rotas do Microsserviço
app.use('/catalog', catalogRoutes);

// Rota de Health Check (para testar se a API está viva)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Catalog Service' });
});

async function bootstrap() {
  try {
    // 1. Tenta conectar ao Banco de Dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

    // 2. Sincroniza os Modelos (Cria as tabelas se não existirem)
    // O { alter: true } ajusta as tabelas se você mudar o código do Model
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados.');

    // 3. Inicia o servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/catalog`);
    });

  } catch (error) {
    console.error('❌ Erro crítico ao iniciar o servidor:', error);
    process.exit(1); // Fecha o processo se não conseguir conectar ao banco
  }
}

bootstrap();
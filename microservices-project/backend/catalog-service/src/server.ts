import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path'; // 1. Import necessário para caminhos de arquivos
import swaggerUi from 'swagger-ui-express'; // 2. Import do Swagger UI
import sequelize from './config/database'; 
import catalogRoutes from './routes/catalog.routes';

// 3. Carregando o JSON do Swagger de forma segura para o Docker
const swaggerDocument = require(path.resolve(__dirname, './docs/swagger.json'));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para entender JSON
app.use(express.json());

// --- CONFIGURAÇÃO DAS ROTAS ---

// 4. Rota do Swagger (Sempre coloque ANTES das outras rotas)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 5. Rota de Health Check (Raiz para facilitar o teste inicial)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Catalog Service' });
});

// Rotas do Microsserviço
app.use('/catalog', catalogRoutes);

// --- INICIALIZAÇÃO ---

async function bootstrap() {
  try {
    // 1. Tenta conectar ao Banco de Dados
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

    // 2. Sincroniza os Modelos
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados.');

    // 3. Inicia o servidor Express ouvindo em 0.0.0.0 (Obrigatório para Docker)
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`📂 Documentação: http://localhost:${PORT}/api-docs`);
    });
    
  } catch (error) {
    console.error('❌ Erro crítico ao iniciar o servidor:', error);
    process.exit(1); 
  }
}

bootstrap();
# Microservices E-commerce Platform

Uma plataforma de e-commerce completa construída com arquitetura de microsserviços, seguindo os melhores padrões de design e desenvolvimento.

## 🏗️ Arquitetura

### Microsserviços
- **api-gateway**: Gateway único de entrada para todas as requisições
- **user-service**: Gerenciamento de usuários, autenticação e autorização
- **catalog-service**: Catálogo de produtos e categorias
- **inventory-service**: Gestão de estoque e movimentações
- **order-service**: Processamento de pedidos com Saga Pattern
- **payment-service**: Processamento de pagamentos

### Padrões Implementados
- ✅ **CQRS** (Command Query Responsibility Segregation)
- ✅ **Event-Driven Architecture** com RabbitMQ
- ✅ **Saga Pattern** para transações distribuídas
- ✅ **Cache Distribuído** com Redis
- ✅ **API Gateway** com rate limiting e autenticação
- ✅ **Consistência Eventual** entre serviços
- ✅ **Observabilidade** (Logs, Metrics, Tracing)
- ✅ **Resiliência** com Circuit Breaker e Retry
- ✅ **Testes Automatizados** (Unit, Integration, E2E)
- ✅ **CI/CD** com GitHub Actions

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Bancos de Dados**: PostgreSQL (um por serviço)
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **ORM**: Prisma
- **Testes**: Jest + Supertest

### Infraestrutura
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoramento**: Prometheus + Grafana
- **Logs**: ELK Stack

## 📂 Estrutura de Pastas

```
microservices-project/
├── backend/
│   ├── api-gateway/
│   ├── user-service/
│   ├── catalog-service/
│   ├── inventory-service/
│   ├── order-service/
│   └── payment-service/
├── frontend/
│   └── web-app/
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── rabbitmq/
│   └── redis/
├── infra/
│   └── scripts/
└── automacoes/
```

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd microservices-project

# Instalar dependências
npm run install:all

# Subir infraestrutura (PostgreSQL, Redis, RabbitMQ)
npm run docker:up

# Executar migrações do banco
npm run db:migrate:all

# Iniciar todos os serviços em desenvolvimento
npm run dev
```

### Acessos

| Serviço | Porta | URL |
|---------|-------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| User Service | 3001 | http://localhost:3001 |
| Catalog Service | 3002 | http://localhost:3002 |
| Inventory Service | 3003 | http://localhost:3003 |
| Order Service | 3004 | http://localhost:3004 |
| Payment Service | 3005 | http://localhost:3005 |
| Frontend | 4000 | http://localhost:4000 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| Redis | 6379 | - |
| PostgreSQL | 5432 | - |

## 🧪 Testes

```bash
# Executar todos os testes
npm run test:all

# Executar testes com coverage
npm run test:coverage

# Executar testes específicos
npm run test:user
```

## 📊 Observabilidade

### Health Checks
```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health
```

### Logs
```bash
# Ver logs de todos os serviços
npm run docker:logs

# Ver logs de serviço específico
docker logs <service-name>
```

## 🔄 CI/CD

O projeto utiliza GitHub Actions para:
- Build automático em Pull Requests
- Execução de testes automatizados
- Build e push de imagens Docker
- Deploy automático em branches principais

## 📚 Documentação

Cada microsserviço possui sua própria documentação:
- [API Gateway](./backend/api-gateway/README.md)
- [User Service](./backend/user-service/README.md)
- [Catalog Service](./backend/catalog-service/README.md)
- [Inventory Service](./backend/inventory-service/README.md)
- [Order Service](./backend/order-service/README.md)
- [Payment Service](./backend/payment-service/README.md)

## 🤝 Contribuição

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ seguindo os melhores padrões de arquitetura de microsserviços.

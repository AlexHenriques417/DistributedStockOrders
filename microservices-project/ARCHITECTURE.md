# Arquitetura do Sistema de Microsserviços

Este documento descreve a arquitetura completa do sistema de e-commerce baseado em microsserviços.

## Visao Geral

```
┌─────────────┐
│   Frontend  │ React + Vite + TypeScript
│   Web App   │ Port: 4000
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│              API Gateway                     │
│   - Rate Limiting                            │
│   - Authentication (JWT)                     │
│   - Load Balancing                           │
│   - Request Routing                          │
│   Port: 3000                                 │
└──────┬──────────────────────────────────────┘
       │
       ├──────────────┬──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  User    │   │ Catalog  │   │Inventory │   │  Order   │   │ Payment  │
│ Service  │   │ Service  │   │ Service  │   │ Service  │   │ Service  │
│  :3001   │   │  :3002   │   │  :3003   │   │  :3004   │   │  :3005   │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PostgreSQL │     │    Redis    │     │  RabbitMQ   │
│  (x6 DBs)   │     │    Cache    │     │   Events    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Microsservicos

### 1. API Gateway (Porta 3000)

**Responsabilidade:** Ponto unico de entrada para todas as requisicoes.

**Funcionalidades:**
- Rate limiting (Redis-backed)
- Autenticacao JWT
- Roteamento para microsservicos
- Proxy reverso
- Metricas Prometheus

**Tecnologias:**
- Express.js
- http-proxy-middleware
- express-rate-limit
- ioredis

### 2. User Service (Porta 3001)

**Responsabilidade:** Gestao de usuarios e autenticacao.

**Funcionalidades:**
- Registro e login
- Geracao de tokens JWT
- Gestao de perfil
- Enderecos de usuario
- Preferencias de usuario
- Audit log

**Eventos Publicados:**
- `user.registered`
- `user.logged_in`
- `user.profile_updated`

**Banco de Dados:** PostgreSQL `user_db` (porta 5432)

### 3. Catalog Service (Porta 3002)

**Responsabilidade:** Gestao de produtos e categorias.

**Funcionalidades:**
- CRUD de produtos
- CRUD de categorias
- Gestao de imagens
- Variantes de produtos
- Avaliacoes de produtos
- Busca e filtros

**Padroes:**
- CQRS (Command Query Responsibility Segregation)
- Cache com Redis

**Eventos Publicados:**
- `catalog.product.created`
- `catalog.product.updated`
- `catalog.product.deleted`
- `catalog.category.created`

**Banco de Dados:** PostgreSQL `catalog_db` (porta 5433)

### 4. Inventory Service (Porta 3003)

**Responsabilidade:** Gestao de estoque.

**Funcionalidades:**
- Controle de quantidade
- Reserva de estoque
- Movimentacoes de estoque
- Alertas de baixo estoque
- Gestao de armazens

**Eventos Publicados:**
- `stock.reserved`
- `stock.released`
- `stock.low`
- `stock.critical`
- `stock.adjusted`

**Eventos Consumidos:**
- `catalog.product.created`

**Banco de Dados:** PostgreSQL `inventory_db` (porta 5434)

### 5. Order Service (Porta 3004)

**Responsabilidade:** Processamento de pedidos.

**Funcionalidades:**
- Criacao de pedidos
- Carrinho de compras
- Checkout
- Calculo de totais
- Cupons de desconto
- Gestao de status

**Padroes:**
- Saga Pattern para transacoes distribuidas
- Orquestracao de eventos

**Eventos Publicados:**
- `order.created`
- `order.confirmed`
- `order.cancelled`
- `order.shipped`
- `order.delivered`

**Eventos Consumidos:**
- `payment.completed`
- `payment.failed`
- `inventory.reserved`
- `inventory.reservation_failed`

**Banco de Dados:** PostgreSQL `order_db` (porta 5435)

### 6. Payment Service (Porta 3005)

**Responsabilidade:** Processamento de pagamentos.

**Funcionalidades:**
- Processamento de pagamentos (mock)
- Gestao de reembolsos
- Multiplos metodos de pagamento
- Transacoes de pagamento
- Webhooks de payment gateway

**Metodos Suportados:**
- Cartao de credito
- PIX
- Boleto bancario

**Eventos Publicados:**
- `payment.completed`
- `payment.failed`
- `payment.refunded`
- `payment.cancelled`

**Eventos Consumidos:**
- `order.created`
- `order.confirmed`

**Banco de Dados:** PostgreSQL `payment_db` (porta 5436)

## Padroes Arquiteturais

### CQRS (Command Query Responsibility Segregation)

Separacao entre operacoes de escrita (Commands) e leitura (Queries).

**Beneficios:**
- Otimizacao independente de leitura/escrita
- Melhor performance
- Escalabilidade independente

**Implementacao:**
- Commands: `src/commands/`
- Queries: `src/queries/`

### Event Sourcing (Parcial)

Alguns servicos armazenam eventos para auditoria e reconstituicao de estado.

**Implementacao:**
- Audit logs
- Transaction history
- Saga state tracking

### Saga Pattern

Coordenacao de transacoes distribuidas entre microsservicos.

**Fluxo de Criacao de Pedido:**
1. Init: Criar pedido (PENDING)
2. Reserve Inventory: Reservar estoque
3. Process Payment: Processar pagamento
4. Confirm Order: Confirmar pedido
5. Complete: Finalizar processo

**Compensacao (Rollback):**
- Se pagamento falha: Liberar estoque
- Se estoque falha: Cancelar pedido

### Circuit Breaker

Protecao contra falhas em cascata.

**Estados:**
- Closed: Operacao normal
- Open: Falha detectada, requisicoes bloqueadas
- Half-Open: Testando recuperacao

### Cache-Aside Pattern

Cache distribuido com Redis.

**Estrategia:**
1. Verificar cache
2. Se miss, buscar do banco
3. Atualizar cache
4. Retornar dados

## Comunicacao

### Sincrona (REST)

- API Gateway -> Microsservicos
- Frontend -> API Gateway

**Formatao:** JSON

### Assincrona (RabbitMQ)

- Microsservicos entre si
- Event-driven architecture

**Exchanges:**
- `user.events`
- `catalog.events`
- `inventory.events`
- `order.events`
- `payment.events`

**Filas:**
- `user.service.queue`
- `catalog.service.queue`
- `inventory.service.queue`
- `order.service.queue`
- `payment.service.queue`

## Seguranca

### Autenticacao

- JWT (JSON Web Tokens)
- Access Token: 7 dias
- Refresh Token: 30 dias

### Autorizacao

- Role-based access control (RBAC)
- Roles: admin, customer, seller

### Protecoes

- Rate Limiting (100 req / 15 min)
- CORS configurado
- Helmet security headers
- Input validation (class-validator)
- SQL injection prevention (Prisma ORM)

## Observabilidade

### Logs

- Winston logger
- Structured logging (JSON)
- Request ID tracking

### Metricas

- Prometheus
- Counter, Gauge, Histogram

**Metricas Coletadas:**
- Request duration
- Error rate
- Active connections
- Database queries

### Tracing Distribuido

- Zipkin
- Request correlation IDs

### Health Checks

Todos os servicos expoe `/health` endpoint com:
- Status do servico
- Conexao com banco
- Status do Redis
- Status do RabbitMQ

## CI/CD

### GitHub Actions Workflows

1. **CI** (`ci.yml`):
   - Lint
   - Test
   - Build
   - Coverage

2. **Pull Request** (`pull-request.yml`):
   - Analise de arquivos alterados
   - Testes apenas dos servicos afetados

3. **Publish** (`publish-docker.yml`):
   - Build multi-platform (amd64, arm64)
   - Push para Docker Hub
   - Versionamento por tags

## Deployment

### Docker

Todos os servicos possuem Dockerfile multi-stage.

### Docker Compose

Orquestracao local de:
- 5 bancos PostgreSQL
- Redis
- RabbitMQ
- Prometheus
- Grafana
- Zipkin

### Infraestrutura Requerida

- Kubernetes (producao)
- Helm charts
- Ingress controller
- Persistent volumes
- Secrets management

## Performance

### Cache

- Redis para dados frequentemente acessados
- TTL default: 5 minutos
- Cache invalidation on writes

### Conexao com Banco

- Connection pooling (Prisma)
- Pool size: 10
- Timeout: 30s

### Rate Limiting

- API Gateway: 100 req / 15 min
- Protecao contra DDoS

## Escalabilidade

### Horizontal

- Stateless services
- Load balancer ready
- Auto-scaling capable

### Vertical

- Resource limits configurados
- Memory and CPU quotas

## Testes

### Unit Tests

- Jest
- Coverage: 80%+

### Integration Tests

- Supertest
- Database transactions rollback

### E2E Tests

- Mock services
- Test containers

## Roadmap

- [ ] GraphQL Federation
- [ ] gRPC communication
- [ ] Event Store
- [ ] Elasticsearch integration
- [ ] Kubernetes Helm Charts
- [ ] Istio service mesh
- [ ] Observability stack completo

---

Documentacao gerada em: 2026-05-27
Versao: 1.0.0

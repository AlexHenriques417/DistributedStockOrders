# 🏗️ Arquitetura - DistributedStockOrders

## Visão Geral

DistributedStockOrders é um sistema de microsserviços distribuído para gerenciar pedidos de estoque com orquestração assíncrona via message queue (RabbitMQ).

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENTE (Dashboard HTML)                      │
│              http://localhost:8000/Dashboard.html                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ HTTP + WebSocket
                   │
┌──────────────────▼───────────────────────────────────────────────┐
│              API GATEWAY (Port 3000)                             │
│  - Autenticação JWT                                             │
│  - Rate Limiting                                                │
│  - Proxy/Roteamento                                             │
└─┬──────┬──────────┬───────────┬──────────────────────────────────┘
  │      │          │           │
  │      │          │           │
  ▼      ▼          ▼           ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐
│Cat.  │ │Inv.   │ │Order   │ │Payment  │ │User  │
│3001  │ │3002   │ │3003    │ │3004     │ │3005  │
└──────┘ └────────┘ └────────┘ └─────────┘ └──────┘
    │         │        │ ▲        │          │
    │         │        │ └─ WS ───┘          │
    │         │        │                     │
    └─────────┼────────┼─────────────────────┘
              │        │
              │        │ Pub/Sub
              │    ┌───▼──────┐
              │    │RabbitMQ  │
              │    │(Event    │
              │    │Bus)      │
              │    └──────────┘
              │
         ┌────▼──────┐
         │ PostgreSQL│
         │ + Redis   │
         │ + Cache   │
         └───────────┘
```

## Componentes Principais

### 1. 📊 Dashboard (Frontend)

- **Tipo**: Aplicação HTML5 pura (sem framework)
- **Porta**: 8000 (via http-server ou Python)
- **Tecnologias**:
  - Socket.io para WebSocket
  - Fetch API para HTTP
  - LocalStorage para persistência

**Funcionalidades:**

- Interface interativa
- Login/Registro
- CRUD de Produtos
- Criação de Pedidos
- Monitoramento em Tempo Real
- Health Checks

### 2. 🔌 API Gateway (Express)

- **Porta**: 3000
- **Responsabilidades**:
  - Autenticação JWT
  - Roteamento de requisições
  - CORS
  - Rate limiting
  - Logs e monitoramento

**Rotas:**

```
POST   /api/users/login              → User Service
POST   /api/users/register           → User Service
GET    /api/catalog/...              → Catalog Service (com auth)
GET    /api/inventory/...            → Inventory Service (com auth)
POST   /api/orders                   → Order Service (com auth)
GET    /api/payments/...             → Payment Service (com auth)
GET    /health                       → Health check
```

### 3. 📦 Catalog Service (NodeJS/Express)

- **Porta**: 3001
- **Banco**: PostgreSQL
- **Cache**: Redis

**Endpoints:**

```
POST   /catalog/products             Criar produto
GET    /catalog/products/:id         Buscar produto
GET    /catalog/products             Listar produtos
PATCH  /catalog/products/:id         Atualizar produto
DELETE /catalog/products/:id         Deletar produto
GET    /catalog/cache/stats          Estatísticas do cache
```

**Eventos Publicados:**

- `product.created` - Quando um produto é criado
- `product.updated` - Quando um produto é atualizado
- `product.deleted` - Quando um produto é deletado

### 4. 📋 Inventory Service (NodeJS/Express)

- **Porta**: 3002
- **Banco**: PostgreSQL

**Endpoints:**

```
GET    /inventory/:productId         Obter estoque
PATCH  /inventory/:productId         Atualizar estoque
GET    /inventory/list               Listar inventário
```

**Eventos:**

- Subscrito em: `product.created` - Cria registro de inventário
- Publica: `inventory.reserved` - Quando estoque é reservado
- Publica: `inventory.released` - Quando reserva é cancelada

### 5. 🛒 Order Service (NodeJS/Express)

- **Porta**: 3003
- **Banco**: PostgreSQL
- **Comunicação**: WebSocket + HTTP

**Endpoints:**

```
POST   /order                        Criar pedido
GET    /order/:id                    Obter pedido
GET    /order/user/:userId           Listar pedidos do usuário
PATCH  /order/:id/status             Atualizar status
DELETE /order/:id                    Cancelar pedido
```

**Events WebSocket:**

```
Emite:
  - order:status_updated             Status do pedido mudou
  - order:subscribed                 Confirmação de inscrição

Escuta:
  - order:subscribe                  Cliente quer monitorar pedido
  - order:unsubscribe               Cliente para de monitorar
```

**Eventos Publicados:**

- `order.created` - Novo pedido criado
- `order.confirmed` - Pedido confirmado
- `order.failed` - Falha no processamento
- `order.completed` - Pedido entregue

### 6. 💳 Payment Service (NodeJS/Express)

- **Porta**: 3004
- **Banco**: PostgreSQL

**Endpoints:**

```
POST   /payment                      Processar pagamento
GET    /payment/:id                  Obter transação
GET    /payment/order/:orderId       Pagamentos do pedido
PATCH  /payment/:id/refund           Reembolsar
```

**Eventos:**

- Subscrito em: `order.created` - Aguarda instruções de pagamento
- Publica: `payment.pending` - Pagamento iniciado
- Publica: `payment.approved` - Pagamento aprovado
- Publica: `payment.failed` - Falha no pagamento
- Publica: `payment.refunded` - Reembolso processado

### 7. 👤 User Service (NodeJS/Express)

- **Porta**: 3005
- **Banco**: PostgreSQL

**Endpoints:**

```
POST   /user/login                   Autenticação
POST   /user/register                Registar novo usuário
GET    /user/:id                     Obter perfil
PATCH  /user/:id                     Atualizar perfil
```

## Fluxo de Dados

### 1. Criação de Produto

```
Dashboard
    │
    ├─ POST /api/catalog/products
    │
    └─→ API Gateway
        │
        └─→ Catalog Service
            │
            ├─ Salva em PostgreSQL
            ├─ Invalida cache Redis
            └─ Publica: product.created (RabbitMQ)
                │
                └─→ Inventory Service
                    └─ Cria registro de estoque
```

### 2. Criação de Pedido

```
Dashboard
    │
    ├─ POST /api/orders
    │
    └─→ API Gateway
        │
        └─→ Order Service
            │
            ├─ Salva em PostgreSQL
            ├─ Gera ID único (UUID)
            ├─ Publica: order.created (RabbitMQ)
            └─ Emite WebSocket: order:subscribed
                │
                ├─→ Inventory Service (reserva estoque)
                │   └─ Publica: inventory.reserved
                │
                └─→ Payment Service (aguarda pagamento)
                    └─ Publica: payment.pending
```

### 3. Processamento de Pagamento

```
Dashboard
    │
    ├─ POST /api/payments
    │
    └─→ API Gateway
        │
        └─→ Payment Service
            │
            ├─ Valida transação
            ├─ Integra com gateway (ex: Stripe)
            ├─ Salva resultado em PostgreSQL
            └─ Publica: payment.approved/failed (RabbitMQ)
                │
                └─→ Order Service
                    │
                    ├─ Atualiza status (PAID/FAILED)
                    └─ Emite WebSocket: order:status_updated
                        │
                        └─→ Dashboard (recebe em tempo real)
```

## Fluxo de Monitoramento em Tempo Real

```
Dashboard                Order Service (WebSocket)
    │                            ▲
    ├─ order:subscribe ID        │
    │─────────────────────────►  │
    │                            │
    │                       Aguardando eventos
    │                       do RabbitMQ
    │                            │
    │                       [order.status_updated evento]
    │                       [atualiza status]
    │                            │
    │  ◄────── order:status_updated ─┤
    │  (websocket)                   │
    │                                │
    └─ Atualiza UI
       ├─ Incrementa counter
       ├─ Adiciona evento à lista
       └─ Dispara notificação
```

## Fluxo de Autenticação

```
1. Login
   Dashboard
      │
      ├─ POST /api/users/login {email, password}
      │
      └─→ API Gateway
          │
          └─→ User Service
              │
              ├─ Hash password com bcrypt
              ├─ Compara com banco
              ├─ Gera JWT (com expiry)
              └─ Retorna token

2. Requisição Autenticada
   Dashboard
      │
      ├─ GET /api/catalog/products/123
      │    Header: Authorization: Bearer <JWT>
      │
      └─→ API Gateway
          │
          ├─ Valida JWT
          ├─ Extrai user ID
          └─→ Catalog Service
              └─ Processa requisição

3. Logout
   Dashboard
      │
      ├─ Limpa localStorage
      ├─ Encerra WebSocket
      └─ Redireciona para login
```

## Padrões de Comunicação

### HTTP (Requisição-Resposta)

- CRUD de recursos
- Operações síncronas
- Respostas imediatas

### Message Queue (Pub/Sub)

- Eventos entre serviços
- Operações assíncronas
- Desacoplamento

### WebSocket

- Notificações em tempo real
- Comunicação bidirecional
- Baixa latência

## Banco de Dados

### PostgreSQL

```sql
-- Tabelas principais
users
  - id (UUID)
  - email
  - password_hash
  - created_at

products
  - id (UUID)
  - name
  - price
  - description
  - created_at

inventory
  - id (UUID)
  - product_id
  - quantity
  - last_updated

orders
  - id (UUID)
  - user_id
  - status (PENDING, PROCESSING, PAID, DELIVERED, CANCELED)
  - total_amount
  - shipping_address
  - created_at
  - updated_at

order_items
  - id (UUID)
  - order_id
  - product_id
  - quantity
  - price

payments
  - id (UUID)
  - order_id
  - amount
  - method (CREDIT_CARD, DEBIT_CARD, PIX, BOLETO)
  - status (PENDING, APPROVED, FAILED, REFUNDED)
  - transaction_id
  - created_at
```

### Redis

- Caching de produtos
- Contadores de eventos
- Sessões temporárias
- Rate limiting

## Escalabilidade

### Horizontal

```
Load Balancer
    │
    ├─→ Catalog Service (instância 1)
    ├─→ Catalog Service (instância 2)
    ├─→ Order Service (instância 1)
    ├─→ Order Service (instância 2)
    └─→ Payment Service (instância 1)

Todos compartilham:
    - PostgreSQL (com replicação)
    - Redis (cluster)
    - RabbitMQ (cluster)
```

### Vertical

- Aumentar recursos (CPU, RAM)
- Otimizar queries de banco
- Implementar cache mais agressivo

## Monitoramento

O dashboard inclui:

- Health checks dos serviços
- Métricas de cache
- Logs em tempo real
- Contadores de eventos
- Histórico de operações

## Segurança

### JWT

- Tokens assinados com secret
- Expiração automática
- Renovação via refresh token (implementar)

### HTTPS/TLS

- Em produção, use HTTPS
- Valide certificados
- Use wss:// para WebSocket

### CORS

- Whitelist de origens
- Métodos HTTP restritos
- Headers validados

### Rate Limiting

- Por IP
- Por usuário
- Por endpoint

## Troubleshooting Arquitetura

### Pedido não é processado

1. Verifique se Order Service está rodando
2. Verifique RabbitMQ (fila vazia?)
3. Verifique logs do serviço
4. Confirme conectividade com PostgreSQL

### WebSocket não funciona

1. Verifique Order Service (3003)
2. Confirme Socket.io configurado
3. Teste conexão direta: `io('http://localhost:3003')`
4. Verifique proxy/firewall

### Cache não funciona

1. Confirme Redis rodando (`redis-cli ping`)
2. Verifique se chaves estão sendo setadas
3. Verifique invalidação de cache
4. Monitore uso de memória

### Autenticação falhando

1. Verifique User Service (3005)
2. Confirme credenciais corretas
3. Verifique hash de password
4. Teste endpoint `/user/login` diretamente

---

**Última atualização:** 2026-05-19

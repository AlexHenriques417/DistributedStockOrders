# 📊 Dashboard Interativo - DistributedStockOrders

Um dashboard completo e interativo para testar e monitorar todos os microsserviços da arquitetura de pedidos distribuídos.

## ✨ Funcionalidades

### 🔐 Autenticação

- **Login**: Autentique-se com email e senha
- **Registro**: Crie uma nova conta
- **Tokens JWT**: Armazenados localmente no `localStorage`
- **Logout**: Desconecte com segurança

### 📦 Catálogo

- Criar novos produtos
- Buscar produtos por ID
- Visualizar detalhes do produto
- Auto-preenchimento de IDs em formulários relacionados

### 📋 Inventário

- Verificar estoque de produtos
- Atualizar quantidades em tempo real
- Monitoramento de disponibilidade

### 🛒 Pedidos

- Criar pedidos completos
- Monitorar status via WebSocket
- Contadores em tempo real (PENDING, PROCESSING, PAID, CANCELED)
- Histórico de eventos

### 💳 Pagamentos

- Processar pagamentos
- Suporte para múltiplos métodos (Cartão, PIX, Boleto)
- Rastreamento de transações

### ⚡ Tempo Real

- WebSocket conectado ao Order Service
- Eventos em tempo real
- Notificações de status
- Logs do sistema

### 🏥 Health Check

- Teste de conectividade com API Gateway
- Status de todos os microsserviços
- Métricas de cache Redis

## 🚀 Como Usar

### Pré-requisitos

- Todos os microsserviços rodando (Catalog, Inventory, Order, Payment, User)
- API Gateway na porta 3000
- Redis e RabbitMQ configurados

### 1. Acesse o Dashboard

```
http://localhost:8000/Dashboard.html
```

ou

```
file:///caminho/para/Dashboard.html
```

### 2. Autentique-se

- **Primeira Vez**: Clique em "Registrar" e crie uma conta
- **Já Tem Conta**: Use as credenciais fornecidas

**Credenciais de Teste**:

```
Email: user@test.com
Senha: password123
```

### 3. Fluxo de Teste Recomendado

#### 1️⃣ Criar Produto

```
1. Vá para a seção "Catálogo"
2. Preencha os dados do produto
3. Clique em "➕ Criar Produto"
4. O ID será automaticamente preenchido nos campos abaixo
```

#### 2️⃣ Verificar Inventário

```
1. Vá para "Inventário"
2. O ID do produto já estará preenchido
3. Clique em "📊 Verificar"
4. Veja a quantidade em estoque
```

#### 3️⃣ Criar Pedido

```
1. Vá para "Criar Novo Pedido"
2. Preencha:
   - ID do Usuário (ou use o padrão)
   - ID do Produto (já preenchido)
   - Quantidade
   - Endereço
3. Clique em "✅ Criar Pedido"
4. O ID do pedido será gerado
```

#### 4️⃣ Monitorar Pedido

```
1. Copie o ID do pedido criado
2. Vá para "Monitorar Pedido"
3. Cole o ID no campo
4. Clique em "👁️ Assinar"
5. Os eventos aparecerão em tempo real
```

#### 5️⃣ Processar Pagamento

```
1. Vá para "Processar Pagamento"
2. Use o ID do pedido anterior
3. Insira o valor
4. Escolha o método
5. Clique em "🔒 Processar Pagamento"
```

## 📊 Layout do Dashboard

O dashboard está organizado em 3 colunas principais:

### Coluna 1: Catálogo & Inventário

- Gerenciamento de produtos
- Criação de novos itens
- Busca e verificação de estoque

### Coluna 2: Pedidos & Pagamentos

- Criação de pedidos
- Monitoramento
- Processamento de pagamentos

### Coluna 3: Eventos & Logs

- Eventos em tempo real
- Logs do sistema
- Health checks
- Métricas de cache

## 🔌 Conectividade

O dashboard está integrado com:

```
API Gateway (3000)
├── Catalog Service (3001)
├── Inventory Service (3002)
├── Order Service (3003)
├── Payment Service (3004)
└── User Service (3005)
```

### Endpoints Utilizados

| Serviço   | Método | Endpoint                     | Uso                 |
| --------- | ------ | ---------------------------- | ------------------- |
| Catalog   | POST   | `/api/catalog/products`      | Criar produto       |
| Catalog   | GET    | `/api/catalog/products/{id}` | Buscar produto      |
| Catalog   | GET    | `/api/catalog/cache/stats`   | Métricas Redis      |
| Inventory | GET    | `/api/inventory/{id}`        | Verificar estoque   |
| Inventory | PATCH  | `/api/inventory/{id}`        | Atualizar estoque   |
| Orders    | POST   | `/api/orders`                | Criar pedido        |
| Payments  | POST   | `/api/payments`              | Processar pagamento |
| Users     | POST   | `/api/users/login`           | Login               |
| Users     | POST   | `/api/users/register`        | Registro            |
| Gateway   | GET    | `/health`                    | Health check        |

## 🔒 Autenticação JWT

O dashboard utiliza JWT (JSON Web Tokens) para autenticação:

1. **Token gerado** após login/registro
2. **Armazenado** no `localStorage`
3. **Enviado** em cada requisição no header `Authorization: Bearer {token}`
4. **Validado** pelo API Gateway e microsserviços

## 📡 WebSocket

Conexão em tempo real com Order Service (porta 3003):

- **Eventos monitorados**: Mudanças de status de pedidos
- **Canais**: `order:status_updated`, `order:subscribed`
- **Reconexão automática**: Em caso de desconexão
- **Multiplexação**: Monitore múltiplos pedidos simultaneamente

## 💾 Armazenamento Local

O dashboard utiliza `localStorage` para:

- `authToken`: Token JWT
- `currentUser`: Dados do usuário logado

Limpar dados: Abra DevTools → Console → `localStorage.clear()`

## 🐛 Troubleshooting

### Erro: "Não conseguiu conectar ao API Gateway"

```
✓ Verifique se o API Gateway está rodando na porta 3000
✓ Teste: curl http://localhost:3000/health
```

### Erro: "WebSocket desconectado"

```
✓ Verifique se o Order Service está rodando (3003)
✓ Verifique se há suporte para WebSocket
```

### Erro: "Não autorizado (401)"

```
✓ Faça login novamente
✓ Limpe o localStorage: localStorage.clear()
✓ Verifique se o token JWT é válido
```

### Produtos não aparecem no Inventário

```
✓ Confirme que o Inventory Service está rodando
✓ Verifique se a conexão com o banco de dados está OK
✓ Consulte os logs do microsserviço
```

## 🎨 Interface

- **Tema**: GitHub Dark Mode
- **Responsividade**: Adaptável para tablets e mobile
- **Performance**: Carregamento rápido, sem dependências externas pesadas
- **Acessibilidade**: Cores contrastantes, font clara

## 🔄 Ciclo de Vida do Pedido

```
[PENDING]
    ↓ (Sistema valida)
[PROCESSING]
    ↓ (Pagamento aprovado)
[PAID]
    ↓ (Entrega realizada)
[DELIVERED]

OU

[PENDING/PROCESSING] → [CANCELED] (em qualquer momento)
```

## 📝 Logs

Todos os eventos são registrados em tempo real:

- ✅ Operações bem-sucedidas
- ⚠️ Advertências
- ❌ Erros
- ℹ️ Informações

Clique em "🗑️ Limpar Logs" para limpar o histórico.

## 🚀 Próximas Melhorias

- [ ] Gráficos de análise de vendas
- [ ] Filtros e busca avançada
- [ ] Exportação de dados (CSV/PDF)
- [ ] Dark mode toggle
- [ ] Notifications browser push
- [ ] Multi-idioma (PT/EN/ES)
- [ ] Suporte offline básico

## 📞 Suporte

Para problemas ou sugestões, verifique:

1. Os logs do dashboard
2. Os logs dos microsserviços
3. A conectividade de rede
4. O status do Redis e RabbitMQ

---

**Dashboard v2.0** | Última atualização: 2026-05-19

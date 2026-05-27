# 🔧 Configuração do Dashboard

Este documento descreve como configurar e personalizar o Dashboard para sua ambiente.

## 📋 Índice

1. [Configuração Padrão](#configuração-padrão)
2. [Ajustar Portas](#ajustar-portas)
3. [Autenticação](#autenticação)
4. [WebSocket](#websocket)
5. [CORS](#cors)
6. [Troubleshooting](#troubleshooting)

## Configuração Padrão

Por padrão, o dashboard espera os seguintes serviços rodando:

```
┌─────────────────────────────────────────┐
│         API Gateway (Port 3000)         │
│  - Autentica requisições com JWT       │
│  - Roteia para microsserviços          │
└─────────────────────────────────────────┘
        ↓          ↓         ↓       ↓        ↓
    Catalog    Inventory   Order  Payment   User
    (3001)     (3002)      (3003)  (3004)   (3005)
                    ↓
              WebSocket (Order Service)
```

## Ajustar Portas

### Opção 1: Editar Diretamente no Dashboard.html

Abra o arquivo `Dashboard.html` e localize a seção de configuração:

```javascript
// Linha ~360
const API_GATEWAY_URL = "http://localhost:3000";
const ORDER_SERVICE_WS = "http://localhost:3003";
```

Altere conforme necessário:

```javascript
// Exemplo: Gateway em outra porta
const API_GATEWAY_URL = "http://localhost:8080";
const ORDER_SERVICE_WS = "http://api.example.com:8080";
```

### Opção 2: Usar Arquivo de Configuração

Crie um arquivo `config.js` no diretório do frontend:

```javascript
// config.js
window.APP_CONFIG = {
  API_GATEWAY_URL: "http://localhost:3000",
  ORDER_SERVICE_WS: "http://localhost:3003",
  LOG_LEVEL: "debug",
  AUTO_REFRESH_INTERVAL: 5000,
};
```

Depois, adicione ao `Dashboard.html` antes do `</head>`:

```html
<script src="config.js"></script>
```

E modifique o Dashboard.html para usar:

```javascript
const API_GATEWAY_URL =
  window.APP_CONFIG?.API_GATEWAY_URL || "http://localhost:3000";
const ORDER_SERVICE_WS =
  window.APP_CONFIG?.ORDER_SERVICE_WS || "http://localhost:3003";
```

## Autenticação

### Configuração do JWT

O dashboard utiliza JWT (JSON Web Tokens) para autenticação. O token é armazenado em `localStorage`:

```javascript
// Token é armazenado aqui
localStorage.setItem("authToken", token);
localStorage.setItem("currentUser", JSON.stringify(user));
```

### Endpoints de Autenticação

O API Gateway deve fornecer:

```
POST /api/users/login
Body: { email, password }
Response: { token, userId, email }

POST /api/users/register
Body: { name, email, password }
Response: { userId, email }
```

### Headers Enviados

Todas as requisições autenticadas incluem:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Ajustar Expiração de Token

Por padrão, o token é armazenado sem expiração no localStorage. Para implementar expiração:

```javascript
// No Dashboard.html, modifique a função de login:
const expirationTime = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
localStorage.setItem("tokenExpiration", expirationTime);

// Verifique expiração ao carregar:
const expiration = localStorage.getItem("tokenExpiration");
if (expiration && Date.now() > expiration) {
  handleLogout();
}
```

## WebSocket

### Configuração

O dashboard se conecta ao Order Service via WebSocket:

```javascript
socketInstance = io(ORDER_SERVICE_WS, {
  transports: ["websocket", "polling"],
  auth: { token: authToken },
});
```

### Eventos Escutados

- `order:status_updated` - Atualização de status de pedido
- `order:subscribed` - Confirmação de inscrição
- `connect` - Conexão estabelecida
- `disconnect` - Desconexão
- `error` - Erro de WebSocket

### Ajustar Reconexão

Para ajustar o comportamento de reconexão:

```javascript
socketInstance = io(ORDER_SERVICE_WS, {
  transports: ["websocket", "polling"],
  auth: { token: authToken },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

## CORS

Se o dashboard está em um domínio diferente dos microsserviços, configure CORS no API Gateway:

### Express (API Gateway)

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:8000", // ou seu domínio
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

### Problemas de CORS

Se receber erro de CORS:

1. Verifique o `origin` configurado no servidor
2. Confirme que o domínio do dashboard corresponde
3. Verifique se `credentials: true` está configurado
4. Teste com `curl`:

```bash
curl -H "Origin: http://localhost:8000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3000/api/catalog/products \
     -v
```

## Variáveis de Ambiente

Para desenvolvimento, crie um arquivo `.env` na raiz do projeto:

```env
# .env
VITE_API_GATEWAY_URL=http://localhost:3000
VITE_ORDER_WS_URL=http://localhost:3003
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug
```

Depois, modifique o Dashboard.html para ler:

```javascript
const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:3000";
```

## SSL/TLS (HTTPS)

Se usar HTTPS, ajuste as URLs:

```javascript
const API_GATEWAY_URL = "https://api.example.com:3000";
const ORDER_SERVICE_WS = "wss://api.example.com:3003"; // Note: wss:// em vez de ws://
```

## Performance

### Configurar Limites de Logs

O dashboard limita logs a 50 entradas e eventos a 30. Ajuste em `Dashboard.html`:

```javascript
// Limitador de logs (linha ~400)
while (logsList.children.length > 50) {
  // Altere 50 conforme necessário
  logsList.removeChild(logsList.lastChild);
}
```

### Cache Local

Limpar localStorage se necessário:

```javascript
// No console do navegador:
localStorage.clear();
location.reload();
```

## Multi-Ambiente

### Desenvolvimento

```javascript
const API_GATEWAY_URL = "http://localhost:3000";
```

### Staging

```javascript
const API_GATEWAY_URL = "https://staging-api.example.com";
```

### Produção

```javascript
const API_GATEWAY_URL = "https://api.example.com";
```

## Troubleshooting

### Erro: "Falha ao conectar ao API Gateway"

**Verificar:**

```bash
# Teste conectividade
curl http://localhost:3000/health

# Verifique CORS
curl -H "Origin: http://localhost:8000" \
     -H "Access-Control-Request-Method: GET" \
     http://localhost:3000/health -v
```

**Solução:**

- Confirme que o gateway está rodando
- Verifique CORS no gateway
- Teste em outro navegador

### Erro: "WebSocket desconectado"

**Verificar:**

```bash
# Teste WebSocket
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     http://localhost:3003
```

**Solução:**

- Confirme que Order Service está rodando
- Verifique se WebSocket está habilitado
- Teste reconexão automática

### Token JWT expirado

**Solução:**

```javascript
// Adicione verificação de expiração
function isTokenValid() {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// Use em cada requisição
if (!isTokenValid()) {
  handleLogout();
}
```

### Credenciais não aceitas

**Verificar:**

- Email e senha estão corretos
- Usuário existe no banco
- Serviço de autenticação está respondendo

**Debug:**

```javascript
// Ative logs detalhados
const res = await fetch(`${API_GATEWAY_URL}/api/users/login`, {...});
console.log('Status:', res.status);
console.log('Response:', await res.text());
```

## Suporte

Para problemas ou dúvidas, consulte:

1. `DASHBOARD_README.md` - Documentação geral
2. Logs do navegador (DevTools → Console)
3. Logs dos microsserviços
4. Variável `eventCounters` no console

---

**Última atualização:** 2026-05-19

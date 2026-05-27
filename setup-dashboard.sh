#!/bin/bash

# ============================================
# SCRIPT DE INICIALIZAÇÃO - DASHBOARD
# ============================================
# Este script facilita o setup e execução do Dashboard

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DistributedStockOrders - Dashboard Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js não encontrado. Por favor, instale Node.js.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado$(node --version)${NC}"

# Criar arquivo de configuração local se não existir
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}Criando arquivo de configuração...${NC}"
    cat > frontend/.env.local << EOF
# Configuração do Dashboard

# API Gateway
REACT_APP_API_GATEWAY_URL=http://localhost:3000

# Serviços Individuais (para testes diretos)
REACT_APP_CATALOG_URL=http://localhost:3001
REACT_APP_INVENTORY_URL=http://localhost:3002
REACT_APP_ORDER_URL=http://localhost:3003
REACT_APP_PAYMENT_URL=http://localhost:3004
REACT_APP_USER_URL=http://localhost:3005

# WebSocket Order Service
REACT_APP_ORDER_WS=http://localhost:3003

# Configurações do Dashboard
REACT_APP_LOG_LEVEL=debug
REACT_APP_AUTO_REFRESH=true
EOF
    echo -e "${GREEN}✓ Arquivo .env.local criado${NC}"
fi

# Função para verificar se porta está em uso
check_port() {
    if nc -z localhost $1 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

echo ""
echo -e "${BLUE}Verificando portas dos microsserviços...${NC}"

declare -A services
services[3000]="API Gateway"
services[3001]="Catalog Service"
services[3002]="Inventory Service"
services[3003]="Order Service"
services[3004]="Payment Service"
services[3005]="User Service"
services[5432]="PostgreSQL"
services[6379]="Redis"
services[5672]="RabbitMQ"

for port in "${!services[@]}"; do
    if check_port $port; then
        echo -e "${GREEN}✓${NC} ${services[$port]} (porta $port) - ${GREEN}ONLINE${NC}"
    else
        echo -e "${RED}✗${NC} ${services[$port]} (porta $port) - ${RED}OFFLINE${NC}"
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  PRÓXIMOS PASSOS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

echo ""
echo -e "${YELLOW}1. Se você quer servir o Dashboard localmente:${NC}"
echo ""
echo -e "   ${GREEN}Opção A: Usando Python 3${NC}"
echo "   cd microservices-project/frontend"
echo "   python3 -m http.server 8000"
echo ""
echo -e "   ${GREEN}Opção B: Usando Node.js (http-server)${NC}"
echo "   npm install -g http-server"
echo "   cd microservices-project/frontend"
echo "   http-server -p 8000"
echo ""
echo -e "   Depois acesse: ${BLUE}http://localhost:8000${NC}"
echo ""

echo -e "${YELLOW}2. Ou simplesmente abra o arquivo no navegador:${NC}"
echo "   ${BLUE}file:///$(pwd)/microservices-project/frontend/Dashboard.html${NC}"
echo ""

echo -e "${YELLOW}3. Ensure todos os serviços estão rodando:${NC}"
echo "   - Execute: ${BLUE}docker-compose up -d${NC}"
echo "   - Verifique os logs: ${BLUE}docker-compose logs -f${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CREDENCIAIS DE TESTE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

echo ""
echo -e "Email: ${GREEN}user@test.com${NC}"
echo -e "Senha: ${GREEN}password123${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup completado com sucesso!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

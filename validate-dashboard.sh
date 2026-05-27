#!/bin/bash

# ============================================
# SCRIPT DE VALIDAÇÃO - DASHBOARD
# ============================================
# Verifica se todos os componentes estão funcionando

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Validação do Dashboard - DistributedStockOrders${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Função para testar
test_service() {
    local name=$1
    local port=$2
    local endpoint=$3
    
    echo -n "Testando $name (porta $port)... "
    
    if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FALHA${NC}"
        ((FAIL++))
        return 1
    fi
}

# Função para verificar arquivo
test_file() {
    local name=$1
    local file=$2
    
    echo -n "Verificando $name... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Existe${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ Não encontrado${NC}"
        ((FAIL++))
        return 1
    fi
}

echo -e "${BLUE}1. Verificando Arquivos${NC}"
test_file "Dashboard.html" "frontend/Dashboard.html"
test_file "index.html" "frontend/index.html"
test_file "DASHBOARD_README.md" "frontend/DASHBOARD_README.md"
test_file "CONFIGURE.md" "frontend/CONFIGURE.md"
test_file "ARCHITECTURE.md" "frontend/ARCHITECTURE.md"
test_file "CHANGELOG.md" "frontend/CHANGELOG.md"
test_file "RESUMO.md" "frontend/RESUMO.md"

echo ""
echo -e "${BLUE}2. Verificando Conteúdo do Dashboard${NC}"

# Procura por keywords importantes
echo -n "Verificando autenticação JWT... "
if grep -q "authToken" frontend/Dashboard.html; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Não encontrado${NC}"
    ((FAIL++))
fi

echo -n "Verificando WebSocket... "
if grep -q "socketInstance = io" frontend/Dashboard.html; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Não encontrado${NC}"
    ((FAIL++))
fi

echo -n "Verificando API Gateway... "
if grep -q "API_GATEWAY_URL" frontend/Dashboard.html; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Não encontrado${NC}"
    ((FAIL++))
fi

echo -n "Verificando funções de Pedidos... "
if grep -q "createOrder" frontend/Dashboard.html; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Não encontrado${NC}"
    ((FAIL++))
fi

echo -n "Verificando funções de Pagamentos... "
if grep -q "processPayment" frontend/Dashboard.html; then
    echo -e "${GREEN}✓ Encontrado${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Não encontrado${NC}"
    ((FAIL++))
fi

echo ""
echo -e "${BLUE}3. Testando Microsserviços${NC}"

test_service "API Gateway" 3000 "/health"
test_service "Catalog Service" 3001 "/catalog/health"
test_service "Inventory Service" 3002 "/inventory/health"
test_service "Order Service" 3003 "/order/health"
test_service "Payment Service" 3004 "/payment/health"
test_service "User Service" 3005 "/user/health"

echo ""
echo -e "${BLUE}4. Testando Dependências Externas${NC}"

test_service "PostgreSQL" 5432 ""
test_service "Redis" 6379 ""
test_service "RabbitMQ" 5672 ""

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Resultado da Validação${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Testes Passados: ${GREEN}$PASS${NC}"
echo -e "Testes Falhados: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO FUNCIONANDO!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Abra http://localhost:8000/Dashboard.html"
    echo "2. Login com: user@test.com / password123"
    echo "3. Comece a testar!"
else
    echo -e "${YELLOW}⚠ Alguns testes falharam${NC}"
    echo ""
    echo "Verifique:"
    echo "1. Se todos os microsserviços estão rodando"
    echo "2. Se o arquivo Dashboard.html existe"
    echo "3. Logs: docker-compose logs -f"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

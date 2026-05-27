#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Microservices Project Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não está instalado. Por favor, instale Docker primeiro.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker encontrado${NC}"

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não está instalado. Por favor, instale Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose encontrado${NC}"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não está instalado. Por favor, instale Node.js 20+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node -v)${NC}"
echo ""

# Subir infraestrutura
echo -e "${YELLOW}Subindo infraestrutura (PostgreSQL, Redis, RabbitMQ)...${NC}"
cd infrastructure
docker-compose up -d

echo -e "${YELLOW}Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar se serviços estão rodando
echo -e "${YELLOW}Verificando saúde dos serviços...${NC}"

# PostgreSQL
if docker exec postgres-user pg_isready -U user_admin -d user_db &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL User Service: OK${NC}"
else
    echo -e "${RED}✗ PostgreSQL User Service: FALHOU${NC}"
fi

# Redis
if docker exec redis redis-cli -a redis_pass_123 ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis: OK${NC}"
else
    echo -e "${RED}✗ Redis: FALHOU${NC}"
fi

# RabbitMQ
if curl -s -u admin:rabbitmq_pass_123 http://localhost:15672/api/overview &> /dev/null; then
    echo -e "${GREEN}✓ RabbitMQ: OK${NC}"
else
    echo -e "${RED}✗ RabbitMQ: FALHOU${NC}"
fi

echo ""
echo -e "${BLUE}Instalando dependências dos microsserviços...${NC}"
cd ..

# Instalar dependências de todos os serviços
for service in api-gateway user-service catalog-service inventory-service order-service payment-service; do
    echo -e "${YELLOW}Instalando $service...${NC}"
    cd backend/$service
    npm install
    npm run build
    cd ../..
done

# Instalar dependências do frontend
echo -e "${YELLOW}Instalando frontend...${NC}"
cd frontend/web-app
npm install
npm run build
cd ../..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Para iniciar os serviços:${NC}"
echo -e "  npm run dev"
echo ""
echo -e "${BLUE}Acessos:${NC}"
echo -e "  API Gateway:     http://localhost:3000"
echo -e "  User Service:    http://localhost:3001"
echo -e "  Catalog Service: http://localhost:3002"
echo -e "  Inventory:       http://localhost:3003"
echo -e "  Order Service:   http://localhost:3004"
echo -e "  Payment Service: http://localhost:3005"
echo -e "  Frontend:        http://localhost:4000"
echo -e "  RabbitMQ Admin:  http://localhost:15672"
echo ""

#!/bin/bash

echo "Checking all services health..."
echo ""

# API Gateway
echo "API Gateway (3000):"
curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "Failed"
echo ""

# User Service
echo "User Service (3001):"
curl -s http://localhost:3001/health | jq . 2>/dev/null || echo "Failed"
echo ""

# Catalog Service
echo "Catalog Service (3002):"
curl -s http://localhost:3002/health | jq . 2>/dev/null || echo "Failed"
echo ""

# Inventory Service
echo "Inventory Service (3003):"
curl -s http://localhost:3003/health | jq . 2>/dev/null || echo "Failed"
echo ""

# Order Service
echo "Order Service (3004):"
curl -s http://localhost:3004/health | jq . 2>/dev/null || echo "Failed"
echo ""

# Payment Service
echo "Payment Service (3005):"
curl -s http://localhost:3005/health | jq . 2>/dev/null || echo "Failed"
echo ""

# Redis
echo "Redis (6379):"
docker exec redis redis-cli -a redis_pass_123 ping 2>/dev/null || echo "Failed"
echo ""

# RabbitMQ
echo "RabbitMQ Management (15672):"
curl -s -u admin:rabbitmq_pass_123 http://localhost:15672/api/overview | jq '.rabbitmq_version' 2>/dev/null || echo "Failed"
echo ""

echo "Health check completed!"

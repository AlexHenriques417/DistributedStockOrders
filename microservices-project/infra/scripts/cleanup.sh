#!/bin/bash

echo "Cleaning up containers and volumes..."
echo ""

# Stop all containers
echo "Stopping all containers..."
cd infrastructure
docker-compose down -v

echo ""
echo "Removing volumes..."
docker volume prune -f

echo ""
echo "Removing dangling images..."
docker image prune -f

echo ""
echo "Cleanup completed!"

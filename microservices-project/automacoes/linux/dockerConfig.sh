#!/bin/bash

# Vai para a pasta onde o script está
cd "$(dirname "$0")"

# Sobe para a raiz do projeto
cd ..

# Detecta Compose corretamente
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "Docker Compose não encontrado!"
    exit 1
fi

while true
do
    clear
    echo "=============================="
    echo "  Ambiente Docker - Projeto"
    echo "=============================="
    echo ""

    # Status do Docker
    if systemctl is-active --quiet docker; then
        echo "Docker: ATIVO"
    else
        echo "Docker: PARADO"
    fi

    echo ""
    echo "1. Ligar Docker"
    echo "2. Desligar Docker"
    echo "3. Criar containers"
    echo "4. Atualizar containers"
    echo "5. Remover containers"
    echo "6. Sair"
    echo ""

    read -p "Escolha uma opcao: " resposta

    case $resposta in
        1)
            echo "Ligando Docker..."
            sudo systemctl start docker
            read -p "Pressione ENTER para continuar..."
            ;;
        2)
            echo "Desligando Docker..."
            sudo systemctl stop docker
            read -p "Pressione ENTER para continuar..."
            ;;
        3)
            echo "Criando containers..."
            $COMPOSE_CMD up -d --build
            read -p "Pressione ENTER para continuar..."
            ;;
        4)
            echo "Atualizando containers..."
            $COMPOSE_CMD down
            $COMPOSE_CMD up -d --build
            read -p "Pressione ENTER para continuar..."
            ;;
        5)
            echo "Removendo containers..."
            $COMPOSE_CMD down -v
            read -p "Pressione ENTER para continuar..."
            ;;
        6)
            echo "Saindo..."
            exit 0
            ;;
        *)
            echo "Opcao invalida!"
            sleep 2
            ;;
    esac
done
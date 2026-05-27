@echo off
REM Cores para output
setlocal enabledelayedexpansion

echo ========================================
echo   Microservices Project Setup
echo ========================================
echo.

REM Verificar se Docker está instalado
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Docker nao esta instalado. Por favor, instale Docker primeiro.
    exit /b 1
)
echo [OK] Docker encontrado

REM Verificar se Docker Compose está instalado
where docker-compose >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Docker Compose nao esta instalado.
    exit /b 1
)
echo [OK] Docker Compose encontrado

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao esta instalado. Por favor, instale Node.js 20+
    exit /b 1
)
echo [OK] Node.js encontrado

echo.

REM Subir infraestrutura
echo Subindo infraestrutura...
cd infrastructure
docker-compose up -d

echo Aguardando servicos iniciarem...
timeout /t 10 /nobreak >nul

echo.
echo Instalando dependencias dos microsservicos...
cd ..

REM Instalar dependências de todos os serviços
for %%s in (api-gateway user-service catalog-service inventory-service order-service payment-service) do (
    echo Instalando %%s...
    cd backend\%%s
    call npm install
    call npm run build
    cd ..\..
)

REM Instalar dependências do frontend
echo Instalando frontend...
cd frontend\web-app
call npm install
call npm run build
cd ..\..

echo.
echo ========================================
echo   Setup concluido com sucesso!
echo ========================================
echo.
echo Para iniciar os servicos:
echo   npm run dev
echo.
echo Acessos:
echo   API Gateway:     http://localhost:3000
echo   User Service:    http://localhost:3001
echo   Catalog Service: http://localhost:3002
echo   Inventory:       http://localhost:3003
echo   Order Service:   http://localhost:3004
echo   Payment Service: http://localhost:3005
echo   Frontend:        http://localhost:4000
echo   RabbitMQ Admin:  http://localhost:15672
echo.

pause

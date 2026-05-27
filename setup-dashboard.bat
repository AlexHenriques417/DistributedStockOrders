@echo off
REM ============================================
REM SCRIPT DE INICIALIZAÇÃO - DASHBOARD
REM ============================================
REM Este script facilita o setup e execução do Dashboard no Windows

setlocal enabledelayedexpansion

echo.
echo ===============================================
echo   DistributedStockOrders - Dashboard Setup
echo ===============================================
echo.

REM Verificar se Node.js está instalado
where node >nul 2>nul
if errorlevel 1 (
    echo [X] Node.js nao encontrado. Por favor, instale Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js encontrado - %NODE_VERSION%

REM Criar arquivo de configuração local se não existir
if not exist "frontend\.env.local" (
    echo Criando arquivo de configuracao...
    (
        echo # Configuracao do Dashboard
        echo.
        echo # API Gateway
        echo REACT_APP_API_GATEWAY_URL=http://localhost:3000
        echo.
        echo # Servicos Individuais (para testes diretos^)
        echo REACT_APP_CATALOG_URL=http://localhost:3001
        echo REACT_APP_INVENTORY_URL=http://localhost:3002
        echo REACT_APP_ORDER_URL=http://localhost:3003
        echo REACT_APP_PAYMENT_URL=http://localhost:3004
        echo REACT_APP_USER_URL=http://localhost:3005
        echo.
        echo # WebSocket Order Service
        echo REACT_APP_ORDER_WS=http://localhost:3003
        echo.
        echo # Configuracoes do Dashboard
        echo REACT_APP_LOG_LEVEL=debug
        echo REACT_APP_AUTO_REFRESH=true
    ) > "frontend\.env.local"
    echo [OK] Arquivo .env.local criado
)

echo.
echo Verificando portas dos microsservicos...
echo.

setlocal enabledelayedexpansion
for %%P in (3000 3001 3002 3003 3004 3005 5432 6379 5672) do (
    echo Verificando porta %%P...
)

echo [!] Nota: Este script simples nao consegue verificar portas no Windows
echo     Use: netstat -an ^| find ":PORTA"

echo.
echo ===============================================
echo   PROXIMOS PASSOS
echo ===============================================
echo.

echo 1. Para servir o Dashboard localmente:
echo.
echo    Opcao A: Usando Python 3
echo    cd microservices-project\frontend
echo    python -m http.server 8000
echo.
echo    Opcao B: Usando Node.js (http-server^)
echo    npm install -g http-server
echo    cd microservices-project\frontend
echo    http-server -p 8000
echo.
echo    Depois acesse: http://localhost:8000
echo.

echo 2. Ou simplesmente abra o arquivo no navegador:
echo    %CD%\microservices-project\frontend\Dashboard.html
echo.

echo 3. Verifique que todos os servicos estao rodando:
echo    - Execute: docker-compose up -d
echo    - Verifique os logs: docker-compose logs -f
echo.

echo ===============================================
echo   CREDENCIAIS DE TESTE
echo ===============================================
echo.
echo Email: user@test.com
echo Senha: password123
echo.

echo ===============================================
echo [OK] Setup completado com sucesso!
echo ===============================================
echo.

pause

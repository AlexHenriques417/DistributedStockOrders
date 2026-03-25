REM ainda em desenvolvimento
REM esse troco e muito precario pior que C, ecaaaaaaaaaaaaaaaaaaa

@echo off
setlocal enabledelayedexpansion

REM Vai para a pasta onde o .bat está
cd /d "%~dp0"

REM Sobe para a raiz do projeto
cd ..

:menu
cls
echo ==============================
echo   Ambiente Docker - Projeto
echo ==============================
echo.
echo 1. Criar container
echo 2. Atualizar container
echo 3. Remover container
echo 4. Sair
echo.
set /p resposta=Escolha uma opcao: 

if "%resposta%"=="1" goto criar
if "%resposta%"=="2" goto atualizar
if "%resposta%"=="3" goto remover
if "%resposta%"=="4" goto sair

echo Opcao invalida!
pause
goto menu

:criar
echo.
echo Criando containers...
docker compose up -d --build
echo.
echo Containers criados com sucesso!
pause
goto menu

:atualizar
echo.
echo Atualizando containers...
docker compose down
docker compose up -d --build
echo.
echo Containers atualizados!
pause
goto menu

:remover
echo.
echo Removendo containers...
docker compose down -v
echo.
echo Containers removidos!
pause
goto menu

:sair
echo Saindo...
exit

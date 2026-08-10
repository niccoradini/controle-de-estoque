@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title Atualizador do Controle de Estoque
color 0A

echo ============================================================
echo       CONTROLE DE ESTOQUE - ATUALIZACAO AUTOMATICA 6.6.2
echo ============================================================
echo.
echo Este atualizador vai:
echo   1. preparar os arquivos do sistema;
echo   2. executar os testes de seguranca;
echo   3. criar um backup do banco online;
echo   4. aplicar migracoes pendentes;
echo   5. publicar a nova versao no Cloudflare.
echo.
echo Nenhum usuario, pedido, chip ou historico sera apagado.
echo.
pause

where node >nul 2>&1
if errorlevel 1 goto :node_missing
where npm >nul 2>&1
if errorlevel 1 goto :node_missing

call :step "Preparando dependencias" npm install
if errorlevel 1 goto :failed

call :step "Conferindo o codigo" npm run check
if errorlevel 1 goto :failed

call :step "Executando os testes" npm test
if errorlevel 1 goto :failed

echo.
echo [4/8] Conferindo o acesso ao Cloudflare...
call npx wrangler whoami
if errorlevel 1 (
  echo.
  echo O navegador sera aberto para conectar sua conta Cloudflare.
  call npx wrangler login
  if errorlevel 1 goto :failed
)

set "BACKUP_FILE=backup-controle-estoque-v662-%RANDOM%.sql"
echo.
echo [5/8] Criando backup do banco em %BACKUP_FILE%...
call npx wrangler d1 export controle-estoque-db --remote --output "%BACKUP_FILE%"
if errorlevel 1 goto :failed

echo.
echo [6/8] Aplicando migracoes pendentes...
call npx wrangler d1 migrations apply controle-estoque-db --remote
if errorlevel 1 goto :failed

echo.
echo [7/8] Validando a publicacao...
call npx wrangler deploy --dry-run --keep-vars
if errorlevel 1 goto :failed

echo.
echo [8/8] Publicando a versao 6.6.2...
call npx wrangler deploy --keep-vars
if errorlevel 1 goto :failed

color 0A
echo.
echo ============================================================
echo              ATUALIZACAO CONCLUIDA COM SUCESSO
echo ============================================================
echo.
echo O backup foi salvo nesta pasta como:
echo %BACKUP_FILE%
echo.
echo O site sera aberto. Pressione Ctrl + F5 para atualizar a tela.
start "" "https://controleestoque.app.br/"
echo.
pause
exit /b 0

:step
echo.
echo %~1...
call %~2 %~3 %~4 %~5 %~6 %~7 %~8 %~9
exit /b %errorlevel%

:node_missing
color 0C
echo.
echo ERRO: Node.js e npm nao foram encontrados neste computador.
echo Instale o Node.js LTS e execute este arquivo novamente.
echo https://nodejs.org/
echo.
pause
exit /b 1

:failed
color 0C
echo.
echo ============================================================
echo                 A ATUALIZACAO FOI INTERROMPIDA
echo ============================================================
echo.
echo Nenhuma etapa seguinte foi executada.
echo Tire uma foto desta tela e envie no chat para verificacao.
echo.
pause
exit /b 1

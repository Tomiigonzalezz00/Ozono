@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo INICIANDO ACTUALIZACION TOTAL DE OZONO
echo ==========================================

echo.
echo 1. Guardando rama actual...
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "INITIAL_BRANCH=%%i"

echo.
echo 2. Actualizando todas las ramas locales...
:: Traemos la info de todas las ramas del remoto sin mezclarlas aun
git fetch --all

:: Iteramos sobre cada rama local
for /f "tokens=*" %%b in ('git branch --format="%%(refname:short)"') do (
    echo Actualizando rama: %%b
    git checkout %%b
    git pull origin %%b
)

echo.
echo 3. Volviendo a la rama original (!INITIAL_BRANCH!)...
git checkout !INITIAL_BRANCH!

echo.
echo 4. Reconstruyendo y levantando Docker...
docker-compose up -d --build

echo.
echo ==========================================
echo Se actualizo OZONO y sus ramas correctamente.
echo Puedes cerrar esta ventana.
echo ==========================================
pause
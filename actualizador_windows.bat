@echo off
echo ==========================================
echo INICIANDO ACTUALIZACION DE OZONO
echo ==========================================

echo.
echo 1. Bajando ultimos cambios de GitHub...
git pull origin main

echo.
echo 2. Reconstruyendo y levantando Docker...
docker-compose up -d --build

echo.
echo ==========================================
echo Se actualizo OZONO correctamente.
echo Puedes cerrar esta ventana.
echo ==========================================
pause
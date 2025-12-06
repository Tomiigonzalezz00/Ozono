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
echo 3. Actualizando workflow de n8n...
timeout /t 15 /nobreak
docker exec mi_n8n n8n import:workflow --input=/workflows/Ozono.json
docker exec mi_n8n n8n update:workflow --id=uvTUAQ4zIKdJAHZS --active=true

echo.
echo ==========================================
echo Se actualizo OZONO correctamente.
echo Puedes cerrar esta ventana.
echo ==========================================
pause
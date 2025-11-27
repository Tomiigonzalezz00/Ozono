#!/bin/bash
echo "Actualizando Ozono..."
git pull origin main
docker-compose up -d --build
echo "Se actualizo OZONO correctamente."
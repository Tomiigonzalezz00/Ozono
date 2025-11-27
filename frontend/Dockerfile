# FRONTEND DOCKERFILE
FROM node:18-alpine

WORKDIR /app

# Copiamos los archivos de configuración
COPY package*.json ./

# Instalamos las dependencias
RUN npm install --legacy-peer-deps

# Copiamos el código fuente
COPY . .

# Exponemos el puerto )
EXPOSE 3000

# Iniciamos en modo desarrollo
CMD ["npm", "start"]
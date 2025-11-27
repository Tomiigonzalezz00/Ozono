# BACKEND DOCKERFILE
# Usamos una versión ligera de Python
FROM python:3.11-slim

# Evita que Python genere archivos .pyc y guarda logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar algunas librerías
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiamos y ejecutamos el requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código
COPY . .

# Exponemos el puerto 
EXPOSE 8000

# Comando para iniciar. 

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

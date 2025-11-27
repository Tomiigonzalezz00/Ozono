# Ozono

## Integrantes - Grupo 2:
- Ferreyra, Tomás Alejo 
- Gabilondo, Danilo
- Gallardo, Juan Ignacio
- Gonzalez, Tomás Nahuel
- Rossi, Iván

------IMPORTANTE-------------------------------------

Antes de comenzar a trabajar, correr los actualizadores:
actualizador_windows, en caso de SO Windows
actualizador_linux-mac, en caso de SO linux/mac

Esto es una automatizacion que hace un pull y un build para el docker, 
para que no haya conflicto de versiones

---------------------------------------------------------------------
Instrucciones para correr con docker: 
Clonar el repositorio y con docker corriendo, poner en terminal 

docker-compose up --build
------------------------------------------------------------------

Instrucciones para correr sin docker(no recomendado):
Nos movemos a la carpeta backend con el comando:

cd backend (1)

Corremos el back con:
python manage.py runserver (2)

Ingresamos a la app en el link : http://127.0.0.1:8000/

Para ingresar al frontend de la app:

Nos movemos a la carpeta src con los comando:

cd frontend (1)

cd src (2)

Corremos la aplicación con:
npm start runserver (3)

Ingresamos a la app en el link : http://localhost:3000/login

Corremos n8n (debe estar instalado) en cmd con:
n8n

nos aseguramos de tener el api key configurado y que la url del bloque de consultas
de puntos verde sea el local host.
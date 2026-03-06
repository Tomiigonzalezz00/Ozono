# Ejecutar Pruebas estáticas con Pylint

- Instalar "pylint" y "pylint-django" con `pip install pylint pylint-django`
- Pararse en la carpeta raíz "backend"
- Ejecutar en la consola el comando `pylint myapp/ --rcfile=.pylintrc`

Archivo de configuración con detalles: `.pylintrc` (en la carpeta backend del proyecto)

### Reglas personalizadas configuradas

| # | Regla | Descripción |
|---|-------|-------------|
| 1 | `C0114` (missing-module-docstring) | Los módulos deben tener docstring |
| 2 | `C0116` (missing-function-docstring) | Las funciones deben tener docstring |
| 3 | `W0612` (unused-variable) | No permitir variables no utilizadas |
| 4 | `E1101` (no-member) | Verificar que los atributos accedidos existan en los objetos |
| 5 | `C0301` (line-too-long) | Las líneas no deben exceder los 120 caracteres |
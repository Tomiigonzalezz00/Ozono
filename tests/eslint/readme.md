# Ejecutar Pruebas estáticas con ESLint

- Instalar "eslint" y plugins con `npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks --legacy-peer-deps`
- Pararse en la carpeta raíz "frontend"
- Ejecutar en la consola el comando `npx eslint ".\src\**\*.js"`

Archivo de configuración con detalles: `.eslintrc.json` (en la carpeta frontend del proyecto)

### Reglas personalizadas configuradas

| # | Regla | Descripción |
|---|-------|-------------|
| 1 | `no-unused-vars` | No permitir variables declaradas que no se utilicen |
| 2 | `react/prop-types` | Los componentes React deben definir sus PropTypes |
| 3 | `no-console` | No permitir console.log en código de producción |
| 4 | `eqeqeq` | Requerir el uso de === y !== en lugar de == y != |
| 5 | `react-hooks/rules-of-hooks` | Asegurar que los hooks se usen correctamente |
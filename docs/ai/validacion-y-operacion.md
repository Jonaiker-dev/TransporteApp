# Validación y operación

El usuario autorizó implementar las diez fases sin aprobaciones intermedias, manteniendo la UI y priorizando móvil. La ejecución y sus resultados se registran en [el informe por fases](ejecucion-fases.md). Los documentos originales se conservan como requisitos; su estado documental inicial no es evidencia de aceptación.

## Ejecutar localmente

Para publicar la PWA, consultar [la guía de Netlify](../publicar-netlify.md).

```sh
npm install
npm run dev:pwa
npm run typecheck
npm test
npm run build:pwa
npm run test:e2e
```

Playwright sirve `dist/pwa` con `tests/serve.mjs`, por lo que hay que compilar antes. Usa Edge instalado en la ruta habitual de Windows cuando está disponible; en otros sistemas instalar el navegador con `npx playwright install chromium`. Las pruebas crean contextos aislados: no usan los datos del navegador habitual. Las capturas y trazas se guardan en `test-results/`, excluido de Git.

El servidor de pruebas entrega HTML, CSS, JS, JSON y SVG con gzip cuando el cliente lo admite. La auditoría Lighthouse local mide esa entrega comprimida. Su puntuación no representa automáticamente un hosting que sirva archivos sin compresión. El cliente de Supabase se carga de forma diferida; no bloquea el inicio del trabajo local.

`npm run lint:check` comprueba Prettier y ESLint sin correcciones automáticas. `npm run lint` modifica archivos; no utilizarlo para una simple comprobación. Las pruebas de dominio cubren conversión exacta, teclado, columnas, mediana y ganancia; las de repositorios cubren migración, transacciones y concurrencia. Las de sincronización usan un adaptador remoto simulado: no son evidencia de un envío real a Supabase.

## Datos e inventario

Leer [el modelo](especificacion/modelo-de-datos.md), [las reglas](especificacion/negocio-y-ux.md) y [ADR-001](decisiones/001-adaptacion-proyecto-existente.md). La base local es `transporteapp`; no debe borrarse para actualizar la aplicación. Los movimientos anteriores se conservan como histórico cerrado con sus totales. Al no tener pesos individuales, no generan inventario ni ganancia reconstruida. Los nuevos movimientos usan UUID y los pesos se guardan en centésimas de kg.

Las compras deben terminarse antes de vender sus paquetes. Las ventas reservan paquetes existentes hasta confirmarse. Cancelar libera reservas; terminar es atómico e impide posteriores ediciones. Cerrar un viaje requiere terminar o cancelar sus movimientos y mantiene el remanente en el camión. Los importes y la ganancia son brutos; los paquetes excluidos se indican en pantalla.

## Configurar el respaldo

1. Crear un proyecto propio de Supabase y revisar/aplicar los archivos de `supabase/migrations/` en orden: `202610230001_transporte.sql` y `202610230002_completar_precios.sql`. El primero crea tablas, índices, relaciones por propietario y políticas RLS; el segundo incorpora el control de asignación única de precios. No se ejecutan automáticamente desde la aplicación.
2. Copiar `.env.example` a `.env` y asignar `SUPABASE_URL` y `SUPABASE_ANON_KEY` (clave pública anon o publishable). Nunca usar `service_role`. Reiniciar desarrollo o recompilar después de cambiar variables.
3. Registrar/iniciar una sesión desde la UI existente. Si el proyecto exige confirmar correo, confirmarlo antes de iniciar sesión.
4. Crear datos sin conexión, reconectar y comprobar el chip, la cola y las filas remotas del mismo propietario. Verificar además que otra cuenta no puede leer ni modificar dichas filas.

El dispositivo queda asociado a su primera cuenta de respaldo; otra cuenta no puede enviar ese inventario como propio. No existe descarga automática de datos en otro dispositivo. La sesión puede expirar: la aplicación mantiene los datos y la cola y permite seguir trabajando. El almacenamiento del navegador puede ser eliminado por el usuario o el sistema; usar también el respaldo JSON local del viaje.

## Comprobaciones manuales pendientes en hardware

Instalar en Android e iPhone, probar safe areas, vibración cuando esté disponible, compartir archivos nativamente, brillo exterior y recuperación de sesión real. Las pruebas emuladas de viewport no sustituyen estos dispositivos. Verificar persistencia concedida por el navegador y el ciclo modo avión → captura → reconexión → filas remotas.

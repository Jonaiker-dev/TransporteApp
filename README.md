# Transporte app (transporteapp)

## Desarrollo por fases con IA

La especificación, las decisiones y el informe de implementación están en
[docs/ai](docs/ai/README.md). Para ejecutar las pruebas, entender la migración del
histórico y configurar Supabase, consultar
[validación y operación](docs/ai/validacion-y-operacion.md).

## PWA y modo sin conexion

La compilacion PWA precarga el shell de la aplicacion y sus recursos locales con
Workbox. Despues de abrirla una vez con conexion y esperar a que el service worker
termine de guardar los recursos, la aplicacion y sus rutas pueden abrirse sin red.
El service worker requiere HTTPS en produccion (localhost funciona para desarrollo).

```bash
pnpm run dev:pwa
pnpm run build:pwa
```

Los datos de la aplicacion deben guardarse con las funciones de
`src/lib/offline-database.ts`: Dexie/IndexedDB conserva los registros localmente y
registra las operaciones pendientes en una outbox atomica. `syncPendingMutations`
las procesa en orden y conserva la operacion actual y las siguientes si el
adaptador de envio falla. No hay todavia un backend ni un contrato de sincronizacion
en este proyecto; al conectarlo, el adaptador debe enviar cada mutacion a la API y
resolver solo tras su confirmacion. La copia local permite seguir trabajando
desconectado, pero el almacenamiento del navegador puede ser borrado por el usuario
o por el sistema.

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Start the app in development mode (HMR, error reporting, etc.)

```bash
quasar dev
```

### Format & Lint the files

```bash
pnpm run lint
# or: yarn/npm/bun run lint
```

...or just check formatting & linting:

```bash
pnpm run lint:check
# or: yarn/npm/bun run lint:check
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).

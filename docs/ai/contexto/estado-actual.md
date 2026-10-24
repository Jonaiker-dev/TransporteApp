# Estado observado del proyecto

Este archivo conserva el diagnóstico inicial anterior a la implementación. Para el estado posterior, las pruebas y los pendientes reales, consultar [la ejecución por fases](../ejecucion-fases.md) y [validación y operación](../validacion-y-operacion.md).

Inspección documental: 23 de octubre de 2026, `America/Lima`. Esta fotografía no sustituye volver a leer el repositorio al comenzar una tarea. No se ejecutaron pruebas funcionales de la aplicación en esta preparación.

## Base existente

| Área         | Evidencia local                                       | Alcance de la observación                                                                               |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Aplicación   | `package.json`, `quasar.config.ts`                    | Quasar, Vue 3, TypeScript, Pinia y Dexie declarados                                                     |
| PWA          | `src-pwa/`, scripts `dev:pwa` y `build:pwa`           | Configuración existente; instalación y uso sin red no comprobados aquí                                  |
| Persistencia | `src/lib/offline-database.ts`                         | Base `transporteapp`, versiones Dexie y tablas `records`, `outbox`, `users`, `movimientos`, `clientes`  |
| Login        | `src/modulos/login/`, `src/stores/auth.ts`            | Autenticación local y restauración desde localStorage; no equivale al Auth de Supabase propuesto        |
| Viajes       | `src/modulos/viajes/`                                 | Páginas, componentes, tipos, API y composables existentes; no se certifican reglas de negocio completas |
| Rutas        | `src/router/index.ts`, `src/router/typed-router.d.ts` | Router combina rutas de módulos y rutas generadas; revisar generación antes de editar declaraciones     |

## Diferencias que deben resolverse al planificar

- La estructura existente usa `src/modulos/` y `src/lib/`; la especificación propone capas `domain`, `repositories` y `sync`. No mover archivos por iniciativa propia.
- Las API de viajes acceden a Dexie directamente. La separación por repositorios y el modelo de entidades objetivo requieren evaluar una adaptación gradual.
- Hay IDs numéricos autoincrementales y una `outbox`; el objetivo propone UUID v4 y `sync_queue`. Definir compatibilidad y migraciones antes de cambiar esquemas. No crear una segunda base local.
- El composable de viajes contiene valores iniciales fijos. Una pantalla existente no demuestra que todos sus indicadores provengan de datos reales.
- Supabase, pdfmake, ExcelJS, Vitest, fake-indexeddb y Playwright no están declarados en el `package.json` raíz inspeccionado. Son herramientas propuestas, no disponibles por asumirlas en el plan.
- La demo HTML mencionada en la referencia no se localizó en los archivos revisados. No inventar su contenido ni afirmar que se consultó.
- Existían modificaciones locales en código, configuración, README y dependencias antes de esta tarea. Conservarlas y revisar `git status` al comenzar cada sesión.

## Comandos declarados

| Comando                               | Uso y precaución                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run dev` / `npm run dev:pwa`     | Desarrollo normal o PWA                                                                            |
| `npm run build` / `npm run build:pwa` | Compilación normal o PWA                                                                           |
| `npm run typecheck`                   | `vue-tsc --noEmit`                                                                                 |
| `npm run lint`                        | Ejecuta Prettier con `--write` y ESLint con `--fix`; modifica archivos                             |
| `npm run lint:check`                  | Ejecuta Prettier sin `--check` y ESLint sin `--fix`; no usarlo como prueba concluyente del formato |

No hay script de tests declarado. Revisar el gestor de paquetes y los scripts reales antes de ejecutar. Para comprobar solo estos Markdown se puede invocar el Prettier local con `--check` y las rutas de documentación. Esta tabla describe comandos disponibles, no resultados de ejecución.

# FASE 1: Base del proyecto, PWA, Dexie y dominio puro

> Estado: implementada y verificada automáticamente en lo indicado en [el informe](../ejecucion-fases.md). Instalación y comprobaciones en dispositivos físicos pendientes.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Objetivo:** esqueleto ejecutable, instalable y offline, con el modelo de datos y la lógica pura probada.

**Tareas**

1. Crear el proyecto Quasar (Vite, Vue 3, TypeScript) con modo PWA, ESLint y Prettier. Configurar el manifest (nombre, iconos, `display: standalone`, tema) y el service worker para precachear los assets y abrir sin red.
2. Definir los tipos TypeScript del modelo de datos de la Parte 0 y el esquema Dexie con sus índices. Migraciones versionadas.
3. Implementar repositorios para `viajes`, `partes`, `movimientos`, `paquetes`, `flete_lineas` con escritura transaccional + encolado en `sync_queue`. Incluir la regla "un solo viaje abierto".
4. Implementar en `domain/` las funciones puras con tests: `formatPeso` / `parsePeso` (centésimas ↔ texto con 2 decimales), `normalizarTeclado` (autocompletar `12.4` → `12.40`, punto automático tras 2 enteros), `groupColumns`, `ganancia`, `costoPaquete`, `medianaPorTipo` y `esOutlier`.
5. Layout base con tema claro/oscuro, router (Inicio, Viaje, Nuevo movimiento, Captura, Cierre) y pantallas vacías.

**Criterios de aceptación**

- La app se instala, abre sin red tras la primera carga y pasa Lighthouse PWA.
- Tests de dominio en verde, incluidos los casos de borde: `12`, `12.`, `12.4`, `0.5`, `100.25`.
- No hay `float` en el almacenamiento de pesos.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

# FASE 2: Viajes y pantalla de inicio

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Objetivo:** inicio y gestión de viajes según las reglas de la Parte 0. Referencia visual: `docs/demo-referencia.html`.

**Tareas**

1. Pantalla de inicio con todos los bloques descritos (tarjeta del viaje, avisos, camión por tipo, últimos movimientos, viajes anteriores). Si no hay viaje, el botón "Iniciar viaje".
2. Detalle de viaje con KPIs y lista de movimientos (card con tipo, parte, fecha, paquetes, kg, estado).
3. Cierre de viaje: bloquear con movimientos en curso, cuadre por tipo, mensaje de que lo restante pasa al siguiente viaje, y reapertura cuando no hay otro abierto.
4. Aviso de "viaje largo" a los 3 o más días.
5. El chip de respaldo lee el conteo de `sync_queue` (por ahora solo lectura).

**Criterios de aceptación**

- Imposible tener dos viajes abiertos (probado a nivel de repositorio).
- Los KPIs se calculan desde Dexie y se actualizan sin recargar.
- Cerrar un viaje no altera el estado de los paquetes `EN_CAMION`.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

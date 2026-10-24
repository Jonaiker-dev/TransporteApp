# FASE 6: Venta sin pesos de compra y terminar movimientos

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Modo de captura para venta con el check desmarcado: el teclado agrega, y cada peso crea un paquete `VENTA_SIN_COMPRA` ya asignado al movimiento.
2. Terminar movimiento (compra y venta): transacción que cambia `EN_VENTA` a `VENDIDO`, marca el movimiento como `TERMINADO` y encola el sync.
3. Vista de detalle de un movimiento terminado, de solo lectura, con columnas de 10 completas.
4. Marcar en las cards los movimientos sin pesos de compra.

**Criterios de aceptación**

- Un movimiento terminado no permite modificar pesos ni estados. La excepción autorizada en [ADR-002](../decisiones/002-ui-precios-y-preview-pdf.md) permite completar los precios faltantes una sola vez, sin cambiar los que ya existen.
- Terminar una venta de 300 paquetes es atómico: si falla, no queda nada a medias.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

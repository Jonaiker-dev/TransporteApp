# FASE 8: Exportación a PDF y Excel

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Exportar por movimiento y por viaje. Encabezado con fecha, viaje, parte, precios por kg y total a cobrar (en ventas).
2. Mismo diseño de columnas de 10 por tipo con subtotales, usando la salida de `groupColumns`. PDF en A4 listo para imprimir.
3. Excel con un bloque por tipo y **subtotales con fórmulas reales** (`SUM`), para que al editar un peso se recalcule.
4. Todo en el cliente y funcionando sin conexión. Compartir/descargar con la API nativa del móvil cuando exista.

**Criterios de aceptación**

- El PDF y el Excel muestran los mismos totales que la pantalla.
- Un movimiento de 300 paquetes se exporta sin congelar la interfaz.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

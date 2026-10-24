# FASE 7: Ganancia o pérdida

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Integrar las funciones puras de ganancia en inicio, detalle de viaje, cards de venta, barra de captura de venta, formulario (costo de referencia) y cierre de viaje (tabla de resultado por tipo).
2. Colores verde/rojo con signo explícito (+ / −) y % sobre costo. No depender solo del color (accesibilidad).
3. Aviso en el momento si un paquete se marca por debajo de su costo.
4. Nota visible de paquetes excluidos por falta de precio o costo.
5. "En camión, a costo" en inicio y en el cierre.

**Criterios de aceptación**

- Tests de dominio: ganancia con precios faltantes, con venta bajo costo, con remanente, y con paquetes de varios lotes con distinto precio de compra.
- Un viaje con la mitad sin vender no muestra pérdida por lo no vendido.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

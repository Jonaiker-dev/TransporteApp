# FASE 4: Captura de pesos en compra (el corazón del MVP)

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Componente `TecladoPesos` reutilizable, con todas las reglas de la Parte 0 (autocompletado, punto automático, auto-agregado, deshacer, vibración, teclado físico, aviso de outlier).
2. Selector de tipo con colores y contador por tipo.
3. Componente `ColumnasPesos` (usa `groupColumns`), con las últimas 2 columnas por tipo y el botón "Ver todas". El último peso agregado se resalta con una animación breve que respete `prefers-reduced-motion`.
4. Barra inferior fija con totales y botón "Terminar compra".
5. Persistir cada peso en Dexie al instante (si la app se cierra, no se pierde nada) y poder retomar el movimiento desde su card.

**Criterios de aceptación**

- Capturar 20 pesos de un tipo requiere 80 toques (4 por peso) con las opciones por defecto, sin tocar "Agregar".
- Con 1500 paquetes en el movimiento, la pantalla sigue fluida (sin renderizar todo).
- Tests de componente para el teclado: `1 2 . 4` + Agregar da `12.40`.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

# FASE 10: Fletes y endurecimiento

> Estado: implementada y verificada automáticamente en lo indicado en [el informe](../ejecucion-fases.md). Instalación y comprobaciones en dispositivos físicos pendientes.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Habilitar el tipo FLETE: formulario con cliente (mismo `q-select` con crear al vuelo), líneas por tipo y cantidad, y consulta/búsqueda de fletes por cliente.
2. Pruebas end-to-end (Playwright) del flujo completo: iniciar viaje → compra → venta con y sin pesos → cierre → exportación.
3. Revisión de rendimiento con datos de prueba de 3000 paquetes y 5 movimientos.
4. Manejo de errores y estados vacíos en todas las pantallas; revisar accesibilidad (contraste, tamaño táctil, etiquetas).
5. Documentar en `docs/` el modelo de datos, las reglas de dominio y cómo ejecutar tests.

**Criterios de aceptación**

- El flujo completo pasa en un viewport móvil de 390×844.
- Sin errores en consola; Lighthouse PWA y rendimiento aceptables en móvil.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

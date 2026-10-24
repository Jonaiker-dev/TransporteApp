# FASE 3: Formulario de nuevo movimiento

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Selector de tipo (Venta / Compra, Flete como opción deshabilitada hasta la fase 10), fecha y precios por kg para R, P, J.
2. Campo de parte con `q-select` con búsqueda (usar `nombre_norm`) y opción final **"Crear «texto»"** que crea la parte al vuelo con solo el nombre y le asigna el rol según el contexto (granja en compra, cliente en venta).
3. En Venta, el check **"¿Tienes registrados los pesos de la compra?"** (activado por defecto) con su texto de ayuda.
4. En Venta, bajo cada precio, mostrar "costo ≈ X /kg" usando `costoPromedio` del stock actual.
5. Botón fijo inferior "Crear y empezar a anotar" (deshabilitado hasta elegir la parte).

**Criterios de aceptación**

- Crear un cliente nuevo toma un solo gesto y no pide más datos.
- Los precios se guardan en centésimas y se muestran con 2 decimales.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

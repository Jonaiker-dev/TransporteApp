# FASE 5: Venta con pesos de compra registrados

> Estado: implementada con evidencia automatizada descrita en [el informe por fases](../ejecucion-fases.md). Consulta allí las pruebas y sus límites.

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Barra de granjas (siempre una seleccionada, con conteo de stock disponible) y selector de tipo con "quedan N" para la granja elegida.
2. Reutilizar `TecladoPesos` en modo "Marcar". Implementar el emparejamiento exacto con FIFO y los 3 mensajes de error de la Parte 0.
3. Lista de disponibles filtrada por prefijo mientras se teclea, agrupada con `×N` para repetidos, virtualizada y limitada a 60 elementos. Tocar un elemento lo marca.
4. Sección "Marcados en esta venta" para desmarcar. Vista previa en columnas de 10 de lo marcado.
5. Barra inferior con paquetes, kg, total en S/ y, si hay costo, la ganancia en vivo. Botón "Confirmar venta".
6. Cancelar movimiento: libera los paquetes `EN_VENTA` a `EN_CAMION`.

**Criterios de aceptación**

- Con dos paquetes de 12.90 en la misma granja, el primero marcado es el de la compra más antigua, y el aviso "Ya van 2…" aparece al marcar el segundo.
- El tercer intento muestra "Ya marcaste los 2 de 12.90 kg…".
- Un paquete no puede quedar asignado a dos movimientos (verificar dentro de una transacción).
- Marcar y desmarcar no genera registros nuevos en `paquetes`.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

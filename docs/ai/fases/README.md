# Fases del producto

Estas diez fases conservan las tareas y los criterios originales. El usuario autorizó su implementación conjunta manteniendo la UI móvil. El [informe de ejecución](../ejecucion-fases.md) registra diagnóstico, cambios y pruebas; los estados siguientes no sustituyen sus límites de aceptación.

| Fase | Documento                                                                          | Estado de implementación   |
| ---- | ---------------------------------------------------------------------------------- | -------------------------- |
| 1    | [FASE 1: Base del proyecto, PWA, Dexie y dominio puro](01-base.md)                 | Implementada; ver informe  |
| 2    | [FASE 2: Viajes y pantalla de inicio](02-viajes.md)                                | Implementada; ver informe  |
| 3    | [FASE 3: Formulario de nuevo movimiento](03-nuevo-movimiento.md)                   | Implementada; ver informe  |
| 4    | [FASE 4: Captura de pesos en compra (el corazón del MVP)](04-captura-compra.md)    | Implementada; ver informe  |
| 5    | [FASE 5: Venta con pesos de compra registrados](05-venta-con-compra.md)            | Implementada; ver informe  |
| 6    | [FASE 6: Venta sin pesos de compra y terminar movimientos](06-venta-sin-compra.md) | Implementada; ver informe  |
| 7    | [FASE 7: Ganancia o pérdida](07-ganancia.md)                                       | Implementada; ver informe  |
| 8    | [FASE 8: Exportación a PDF y Excel](08-exportacion.md)                             | Implementada; ver informe  |
| 9    | [FASE 9: Sincronización con Supabase](09-sincronizacion.md)                        | Pendiente validar Supabase |
| 10   | [FASE 10: Fletes y endurecimiento](10-fletes.md)                                   | Implementada; ver informe  |

## Orden y dependencias

El orden propuesto es 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10. La fase 1 establece la base de datos y las funciones puras; las siguientes incorporan flujos e integraciones. La fase 7 completa la visualización de cálculos definidos desde la base. La fase 9 necesita la cola transaccional prevista desde la fase 1.

El proyecto ya contiene código de viajes, login y fletes. La fase 10 propone habilitar fletes: esta indicación original no autoriza deshabilitar ni eliminar los existentes. Resolver esa diferencia en el diagnóstico correspondiente.

Si un criterio o una herramienta de validación del original no está disponible, documentar el bloqueo y proponer evidencia equivalente en el plan. No declarar éxito sustituyendo silenciosamente criterios.

Para cambios futuros, enlazar una entrega con evidencia de sus criterios. La autorización explícita de esta sesión permitió recorrer las diez fases; no autoriza commits ni despliegues. Supabase remoto e instalación física conservan pendientes expresos.

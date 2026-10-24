# Guía de desarrollo con IA

Esta carpeta organiza la especificación y el seguimiento de TransporteApp. La primera preparación fue documental; después el usuario autorizó implementar las diez fases conservando la UI móvil. Consulta [la ejecución por fases](ejecucion-fases.md) para distinguir implementación, pruebas y pendientes externos, y [validación y operación](validacion-y-operacion.md) para ejecutar la aplicación.

## Mapa

```text
AGENTS.md                         Reglas de entrada para el agente
docs/ai/
  README.md                       Índice y uso
  flujo-de-trabajo.md              Ciclo de planificación, implementación y revisión
  contexto/
    estado-actual.md               Lo observado y las diferencias con el objetivo
  especificacion/
    negocio-y-ux.md                Negocio, captura, ventas, viajes, ganancia y UX
    arquitectura.md               Stack, capas y convenciones objetivo
    modelo-de-datos.md             Entidades, estados e índices objetivo
    sincronizacion.md             Respaldo push y funcionamiento sin sesión
  fases/
    README.md                     Orden, dependencias y estado de las diez fases
    01-base.md ... 10-fletes.md    Tareas y criterios del documento original
  plantillas/
    tarea.md                      Solicitud acotada
    plan.md                       Plan revisable antes de implementar
    revision.md                   Evidencia y entrega
    decision.md                   Registro de decisiones de arquitectura
  decisiones/
    README.md                     Índice de decisiones futuras
  referencias/
    prompt-original.md            Contenido original sin modificaciones
    README.md                     Procedencia y referencia visual pendiente
```

## Cómo usarla

1. Empieza por `AGENTS.md` y `contexto/estado-actual.md`.
2. Selecciona una tarea o fase del [índice de fases](fases/README.md).
3. Pide un plan usando [la plantilla de tarea](plantillas/tarea.md). El agente debe contrastar el objetivo con el código actual.
4. Revisa el plan. Una solicitud de análisis o documentación no autoriza implementar.
5. Después de autorizar la implementación, revisa el diff y la evidencia de validación con [la plantilla de revisión](plantillas/revision.md).

Ejemplo para iniciar una sesión de planificación:

> Lee `AGENTS.md`, `docs/ai/contexto/estado-actual.md` y `docs/ai/fases/01-base.md`. Inspecciona el código relacionado y propone un plan que aproveche lo existente. Solo planifica: no edites código ni instales dependencias.

Ejemplo después de aprobar un plan concreto:

> Implementa únicamente el plan aprobado para la tarea indicada. Conserva los cambios locales ajenos, valida lo modificado y reporta resultados reales y criterios pendientes. No avances a otra fase ni hagas commit.

Los enlaces entre documentos permiten usarlos desde distintos asistentes. No se ha configurado ninguna integración específica de Cursor ni ejecución automática de agentes. Las plantillas se copian en la conversación o en un documento de tarea nuevo; no se rellenan sobrescribiendo su contenido base.

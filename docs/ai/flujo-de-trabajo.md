# Flujo de trabajo con IA

## Preparar el contexto

Leer `AGENTS.md`, el estado actual, la fase seleccionada y las especificaciones relacionadas. Revisar `git status`, los archivos implicados y los scripts reales. Diferenciar requisitos objetivo de comportamiento comprobado. No cargar todas las fases si la tarea solo requiere una.

## Planificar

Usar [la plantilla de plan](plantillas/plan.md). Identificar qué se puede reutilizar, qué falta, las diferencias con el modelo objetivo y cómo preservar datos locales. Presentar alcance, archivos probables, validación y criterios de aceptación. Si solo se pidió documentación, detenerse en la entrega documental.

## Implementar cuando esté autorizado

Trabajar únicamente en la tarea y el plan aprobados. No recrear Quasar ni duplicar Dexie. Mantener la lógica pura separada de UI y persistencia al incorporar cambios de arquitectura autorizados. Si aparece una decisión que amplía el alcance, documentar su impacto y solicitar la autorización correspondiente antes de hacer ese cambio.

## Verificar y revisar

Ejecutar comprobaciones proporcionales al cambio. Al implementar lógica de dominio, proponer pruebas de casos de negocio; para repositorios, transacciones e integridad; para offline y PWA, pruebas reales en navegador. Si no existe infraestructura, declararlo y planificarla cuando corresponda. No instalarla durante una tarea documental.

Revisar el diff, contrastar cada criterio de la fase y entregar resultados reales con [la plantilla de revisión](plantillas/revision.md). Un comando no ejecutado se registra como pendiente; un archivo creado no implica un criterio validado. No marcar una fase completa si quedan criterios sin comprobar.

## Continuidad entre sesiones

Actualizar el estado de la fase solo con evidencia. Registrar decisiones aceptadas en `decisiones/`. En la entrega dejar el siguiente paso y sus límites de autorización. No iniciar otra fase, hacer commit ni publicar por haber terminado la actual.

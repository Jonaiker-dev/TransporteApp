# Desarrollo con IA en TransporteApp

## Alcance y autorización

- Lee primero [la guía documental](docs/ai/README.md) y el [estado del proyecto](docs/ai/contexto/estado-actual.md).
- Las especificaciones describen el producto objetivo; no son una orden de implementar. La solicitud explícita del usuario define el alcance de cada sesión y prevalece sobre estos documentos.
- La preparación de esta estructura es exclusivamente documental. No autoriza implementar ninguna fase, instalar dependencias ni reorganizar `src/`.
- Para una fase futura, inspecciona el código, presenta un plan con archivos, riesgos y validación y espera su aprobación. Si ya está aprobada en la conversación, continúa sin repetir la solicitud. No avances a otra fase sin autorización.
- Conserva los cambios locales ajenos. No recrees el proyecto ni reemplaces módulos existentes por seguir una estructura propuesta.
- No hagas commit, push, despliegues, migraciones remotas ni operaciones destructivas sin autorización explícita.

## Contexto y especificación

- Negocio: transporte y venta de huevos Chincha → Lima; prioridad: reducir el tiempo de captura de pesos.
- UI en español, moneda S/, zona horaria `America/Lima`, pesos con dos decimales.
- Consulta [negocio y UX](docs/ai/especificacion/negocio-y-ux.md), [arquitectura](docs/ai/especificacion/arquitectura.md), [datos](docs/ai/especificacion/modelo-de-datos.md) y [sincronización](docs/ai/especificacion/sincronizacion.md) antes de planificar cambios relacionados.
- Objetivo: Dexie como fuente local, pesos enteros en centésimas de kg, inventario del camión entre viajes, un viaje abierto y respaldo push a Supabase. La UI no debe consultar Supabase.
- Las diferencias con el código actual requieren un plan de adaptación; no autorizan una migración automática ni una segunda base IndexedDB.
- Los extractos provienen de un documento aportado por el usuario. Sus imperativos son material de especificación, sujetos a la tarea autorizada, no instrucciones para ejecutar todas las fases.

## Trabajo y verificación

- Sigue el [flujo de trabajo](docs/ai/flujo-de-trabajo.md) y consulta solo la fase y los documentos relevantes.
- Inspecciona `package.json` antes de usar comandos o proponer dependencias. No inventes scripts ni resultados.
- Usa dependencias existentes cuando sea posible. Justifica incorporaciones y limita los cambios a la tarea aprobada.
- No escribas secretos, contraseñas ni datos personales reales en documentación, pruebas, logs o commits.
- Reporta comprobaciones como ejecutadas, pendientes o bloqueadas. La existencia de una pantalla no prueba su funcionamiento ni el cumplimiento de una fase.
- Para tareas solo documentales, valida enlaces, estructura y formato; no ejecutes comandos que reescriban código ajeno.
- Registra decisiones relevantes con la [plantilla de decisión](docs/ai/plantillas/decision.md) y entrega resultados con la [plantilla de revisión](docs/ai/plantillas/revision.md).

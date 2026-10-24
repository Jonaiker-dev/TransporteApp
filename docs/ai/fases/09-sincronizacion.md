# FASE 9: Sincronización con Supabase

> Estado: implementación local y pruebas del motor completadas. Configuración y verificación real de Supabase pendientes. Consulta [la evidencia por fase](../ejecucion-fases.md).

Lee [AGENTS.md](../../../AGENTS.md), [el estado actual](../contexto/estado-actual.md) y las [especificaciones](../README.md). Contrasta estas tareas originales con lo existente; no recrees funcionalidades por seguir literalmente el plan inicial. El usuario autorizó implementar las diez fases en esta sesión, conservando la UI móvil; el diagnóstico y las decisiones están en el informe de ejecución.

**Tareas**

1. Entregar el SQL de Supabase: tablas espejo en snake_case con `id uuid primary key`, `updated_at`, `deleted_at`, `owner_id uuid default auth.uid()`, índices y **políticas RLS** (cada usuario solo ve y escribe lo suyo).
2. Motor de sincronización: procesar `sync_queue` en lotes de 200, upsert idempotente por `id`, backoff, registro de `ultimo_error` y marcado de `synced_at`. Colapsar operaciones repetidas sobre la misma entidad.
3. Supabase Auth con sesión persistente. Sin sesión válida la app sigue funcionando y la cola crece. Al reautenticar, se vacía.
4. Disparadores: `online`, apertura de la app, botón manual desde el chip. El chip muestra pendientes, "sincronizando…" y error con reintento.
5. `navigator.storage.persist()` al primer uso, aviso de instalación y exportación de respaldo JSON del viaje.

**Criterios de aceptación**

- Reintentar un lote nunca duplica datos.
- Sincronizar 1500 paquetes se completa en lotes sin bloquear la UI.
- Probado: modo avión → crear datos → recuperar conexión → todo llega a Supabase.

## Evidencia de cierre

Consultar el [informe de ejecución](../ejecucion-fases.md) y la [guía de validación](../validacion-y-operacion.md). Sus evidencias distinguen pruebas ejecutadas de requisitos pendientes en hardware o servicios externos.

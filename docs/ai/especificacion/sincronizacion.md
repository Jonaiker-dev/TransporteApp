# Respaldo y sincronización objetivo

> Especificación objetivo extraída del documento original. No certifica el estado del código ni autoriza su implementación. Consulta [el estado actual](../contexto/estado-actual.md) y [AGENTS.md](../../../AGENTS.md).

## Sincronización (MVP: solo push)

- Cola `sync_queue` procesada en lotes de 200, con **upsert idempotente por id** hacia Supabase. Reintentos con backoff exponencial. Agrupar los cambios por movimiento.
- Disparadores: evento `online`, al abrir la app, botón manual. **No depender de Background Sync** (no es confiable en iOS).
- Llamar a `navigator.storage.persist()` y guiar a instalar la PWA. Ofrecer exportar un respaldo JSON local del viaje.
- Supabase Auth (email y contraseña). La app **debe funcionar sin sesión válida**: acumula la cola y sincroniza cuando se pueda reautenticar. Activar RLS en todas las tablas desde el inicio.

## Estado y límites

La outbox local existente no prueba que Supabase esté integrado. Planificar el contrato de cola, la autenticación y la asociación de datos locales a su propietario antes de sincronizar. El SQL, las credenciales y cualquier operación remota quedan fuera de esta preparación documental.

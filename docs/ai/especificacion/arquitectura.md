# Arquitectura objetivo

> Especificación objetivo extraída del documento original. No certifica el estado del código ni autoriza su implementación. Consulta [el estado actual](../contexto/estado-actual.md) y [AGENTS.md](../../../AGENTS.md).

## Stack

- Quasar (Vite, Vue 3, Composition API, `<script setup>`, **TypeScript**) en modo PWA.
- Dexie (IndexedDB) como base local y **fuente de verdad**. No hay una segunda IndexedDB aparte.
- Supabase (Postgres + Auth) solo como respaldo mediante sincronización de un solo sentido (push) en el MVP.
- Exportación en cliente: pdfmake (PDF) y ExcelJS (Excel, con fórmulas reales para los subtotales).
- Pruebas: Vitest para lógica pura; Playwright opcional al final.
- Interfaz en español. Moneda: soles (S/). Zona horaria: America/Lima.

## Arquitectura (reglas no negociables)

1. **La UI nunca lee de Supabase.** Solo de Dexie, a través de repositorios.
2. Capas: `pages/components` → `composables` → `repositories` (única capa que toca Dexie) → `sync` (única capa que toca Supabase). La lógica de dominio vive en `domain/` como **funciones puras sin dependencias de UI ni de Dexie**.
3. Todos los IDs son **UUID v4 generados en el cliente**.
4. Toda tabla lleva `id, created_at, updated_at, deleted_at (borrado lógico), synced_at`. Todo cambio se escribe en Dexie y se encola en `sync_queue` **en la misma transacción**.
5. **Los pesos se guardan como enteros en centésimas de kg** (`peso_c`: 21.45 kg = 2145) para evitar errores de coma flotante. Se convierten a decimal solo para mostrar.
6. Todo debe funcionar sin red, incluida la exportación a PDF/Excel.
7. Solo un viaje puede estar abierto a la vez (validar dentro de una transacción en el repositorio).

## Convenciones

- Estructura: `src/domain` (puro), `src/db` (Dexie y esquema), `src/repositories`, `src/sync`, `src/composables`, `src/components`, `src/pages`, `src/utils`, `docs/`.
- Cada módulo de `domain/` tiene tests de Vitest. Los repositorios tienen tests con `fake-indexeddb`.
- Commits pequeños, uno por fase. No introducir dependencias nuevas sin justificarlas.
- Antes de dar una fase por terminada: ejecutar los scripts disponibles de `lint`, `typecheck` y tests; reportar resultados reales y dejar explícitos los bloqueos. No hacer commit sin autorización.

## Adaptación al código existente

El esquema de capas es un objetivo. La definición de Dexie y sus migraciones reside en la capa de infraestructura; los repositorios encapsulan las operaciones de negocio sobre ella. El motor de sync consume la cola local mediante contratos de persistencia y concentra el acceso a Supabase. Concretar estas dependencias en un plan antes de modificar el proyecto, evitando ciclos y una segunda base local.

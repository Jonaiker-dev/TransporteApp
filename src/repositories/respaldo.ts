import { offlineDatabase as db } from '../db/database';
import type { Entidad, SyncItem, Tabla } from '../domain/model';

const prioridad: Record<Tabla, number> = {
  viajes: 0,
  partes: 1,
  movimientos: 2,
  paquetes: 3,
  flete_lineas: 4,
};
export async function vincularPropietario(id: string): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const owner = await db.settings.get('backup_owner');
    if (owner && owner.value !== id)
      throw new Error(
        'Este dispositivo está vinculado a otra cuenta de respaldo. Usa la cuenta original para proteger sus datos.',
      );
    if (!owner) await db.settings.put({ key: 'backup_owner', value: id });
  });
}
export async function lotePendiente(limit = 200, now = Date.now()) {
  return db.transaction(
    'r',
    [db.sync_queue, db.viajes, db.partes, db.movimientos, db.paquetes, db.flete_lineas],
    async () => {
      const queue = await db.sync_queue.toArray();
      const grouped = new Map<string, SyncItem[]>();
      for (const row of queue) {
        const key = `${row.tabla}:${row.entidad_id}`;
        const rows = grouped.get(key) ?? [];
        rows.push(row);
        grouped.set(key, rows);
      }
      const candidates = [...grouped.values()]
        .filter((rows) => rows.every((r) => r.siguiente_intento <= now))
        .sort(
          (a, b) =>
            prioridad[a[0]!.tabla] - prioridad[b[0]!.tabla] ||
            (a[0]!.movimiento_id ?? '').localeCompare(b[0]!.movimiento_id ?? '') ||
            a[0]!.seq! - b[0]!.seq!,
        )
        .slice(0, limit);
      const result: { tabla: Tabla; entidad: Entidad; rows: SyncItem[] }[] = [];
      for (const rows of candidates) {
        const tabla = rows[0]!.tabla;
        const entidad = await db.table<Entidad, string>(tabla).get(rows[0]!.entidad_id);
        if (!entidad)
          throw new Error(
            'La cola contiene un registro sin datos locales. Conserva un respaldo antes de revisar la base.',
          );
        result.push({ tabla, entidad, rows });
      }
      return result;
    },
  );
}
export async function confirmarLote(batch: Awaited<ReturnType<typeof lotePendiente>>) {
  await db.transaction(
    'rw',
    [db.sync_queue, db.viajes, db.partes, db.movimientos, db.paquetes, db.flete_lineas],
    async () => {
      for (const item of batch) {
        await db.sync_queue.bulkDelete(item.rows.map((r) => r.seq!));
        const remaining = await db.sync_queue
          .where('[tabla+entidad_id]')
          .equals([item.tabla, item.entidad.id])
          .count();
        if (!remaining)
          await db
            .table<Entidad, string>(item.tabla)
            .update(item.entidad.id, { synced_at: new Date().toISOString() });
      }
    },
  );
}
export async function fallarLote(batch: Awaited<ReturnType<typeof lotePendiente>>, error: string) {
  await db.transaction('rw', db.sync_queue, async () => {
    for (const item of batch)
      for (const row of item.rows) {
        if (row.seq === undefined) throw new Error('Registro de cola sin secuencia.');
        await db.sync_queue.update(row.seq, {
          intentos: row.intentos + 1,
          ultimo_error: error.slice(0, 400),
          siguiente_intento:
            Date.now() + Math.min(300000, 1000 * 2 ** Math.min(8, row.intentos + 1)),
        });
      }
  });
}
export async function siguienteReintento(): Promise<number | null> {
  const row = await db.sync_queue.orderBy('siguiente_intento').first();
  return row ? row.siguiente_intento : null;
}

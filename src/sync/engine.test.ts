import { beforeEach, expect, it } from 'vitest';
import { offlineDatabase as db } from '../lib/offline-database';
import { iniciarViaje, crearMovimiento, agregarPeso } from '../repositories/transporte';
import { procesarCola } from './engine';
import type { Entidad } from '../domain/model';
beforeEach(async () => {
  await db.delete();
  await db.open();
});
it('upsert idempotente, lotes de hasta 200, cambios durante envío y propietario fijo', async () => {
  await iniciarViaje();
  const m = await crearMovimiento({
    tipo: 'COMPRA',
    fecha: '2026-10-23',
    nombre: 'Granja',
    precios: {},
  });
  for (let i = 0; i < 1500; i++) await agregarPeso(m.id, 'R', 2145);
  const remote = new Map<string, Entidad>();
  let fallar = true;
  const enviar = (_tabla: string, rows: Entidad[]) => {
    expect(rows.length).toBeLessThanOrEqual(200);
    rows.forEach((r) => remote.set(r.id, r));
    if (fallar) {
      fallar = false;
      return Promise.reject(new Error('Confirmación perdida'));
    }
    return Promise.resolve();
  };
  await expect(procesarCola('owner-1', enviar)).rejects.toThrow();
  expect(await db.sync_queue.count()).toBeGreaterThan(0);
  await db.sync_queue.toCollection().modify({ siguiente_intento: 0 });
  await procesarCola('owner-1', enviar);
  expect(remote.size).toBe(1503);
  expect(await db.sync_queue.count()).toBe(0);
  await expect(procesarCola('owner-2', enviar)).rejects.toThrow('otra cuenta');
}, 30000);
it('no elimina cambios locales nuevos mientras confirma un envío anterior', async () => {
  const viaje = await iniciarViaje();
  let changed = false;
  await procesarCola('owner', async (tabla) => {
    if (tabla === 'viajes' && !changed) {
      changed = true;
      const { atomic, guardar } = await import('../repositories/transporte');
      await atomic(async () => {
        const v = (await db.viajes.get(viaje.id))!;
        v.nota = 'Cambio durante envío';
        await guardar('viajes', v);
      });
    }
  });
  expect((await db.viajes.get(viaje.id))!.nota).toBe('Cambio durante envío');
  expect((await db.viajes.get(viaje.id))!.synced_at).not.toBeNull();
  expect(await db.sync_queue.count()).toBe(0);
});

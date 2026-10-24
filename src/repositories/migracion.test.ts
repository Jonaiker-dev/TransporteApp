import Dexie from 'dexie';
import { expect, it } from 'vitest';
import { offlineDatabase as db } from '../lib/offline-database';
it('migra la versión 4 sin borrar registros ni inventar stock', async () => {
  await db.delete();
  const old = new Dexie('transporteapp');
  old.version(4).stores({
    records: '[collection+id], collection, updatedAt, syncStatus',
    outbox: '++id, [collection+recordId], createdAt',
    users: '++id, &email, rol, createdAt',
    movimientos: '++id, tipo, fecha, entidad, createdAt',
    clientes: '++id, &[tipo+nombreNormalizado], tipo, nombreNormalizado',
  });
  await old.open();
  await old.table('movimientos').add({
    tipo: 'compra',
    fecha: '18/10/2026',
    entidad: 'Granja Águila',
    rosadoPrecio: 5.25,
    kilosTotal: 214.5,
    paquetesTotal: 10,
    montoTotal: 1126.13,
    createdAt: 1,
  });
  await old.table('clientes').add({
    nombre: 'Granja Águila',
    nombreNormalizado: 'granja aguila',
    tipo: 'granja',
    createdAt: 1,
  });
  old.close();
  await db.open();
  expect(await db.legacy_movimientos.count()).toBe(1);
  const m = (await db.movimientos.toArray())[0]!;
  expect(m.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(m.legacy_id).toBe(1);
  expect(m.precios.R).toBe(525);
  expect(m.legacy_resumen?.peso_c).toBe(21450);
  expect((await db.viajes.toArray())[0]!.estado).toBe('CERRADO');
  expect(await db.paquetes.count()).toBe(0);
  expect(await db.partes.count()).toBe(1);
  expect(await db.sync_queue.count()).toBe(3);
  await db.delete();
});

import { beforeEach, describe, expect, it } from 'vitest';
import { offlineDatabase as db } from '../lib/offline-database';
import {
  iniciarViaje,
  crearMovimiento,
  agregarPeso,
  terminarMovimiento,
  cerrarViaje,
  reabrirViaje,
  marcarPeso,
  deshacerPeso,
  cancelarMovimiento,
  snapshot,
  completarPrecios,
} from './transporte';
import { ganancia } from '../domain/ganancia';
beforeEach(async () => {
  await db.delete();
  await db.open();
});
const compra = (nombre = 'Granja Águila', fecha = '2026-10-23') =>
  crearMovimiento({ tipo: 'COMPRA', nombre, fecha, precios: { R: 500 } });
const venta = () =>
  crearMovimiento({
    tipo: 'VENTA',
    nombre: 'Cliente',
    fecha: '2026-10-23',
    precios: { R: 600 },
    tiene_pesos_compra: true,
  });
describe('integridad de viajes e inventario', () => {
  it('completa compra y venta una vez con movimiento y viaje cerrados, recalculando la ganancia', async () => {
    const v = await iniciarViaje();
    const c = await crearMovimiento({
      tipo: 'COMPRA',
      nombre: 'Sin precio',
      fecha: '2026-10-23',
      precios: {},
    });
    await agregarPeso(c.id, 'R', 1290);
    await terminarMovimiento(c.id);
    const s = await crearMovimiento({
      tipo: 'VENTA',
      nombre: 'Cliente',
      fecha: '2026-10-23',
      precios: {},
      tiene_pesos_compra: true,
    });
    await marcarPeso(s.id, 'R', c.parte_id, 1290);
    await terminarMovimiento(s.id);
    await cerrarViaje(v.id);
    let state = await snapshot();
    expect(ganancia(state.paquetes, state.movimientos).excluidos).toBe(1);
    const pending = await db.sync_queue.count();
    await completarPrecios(c.id, { R: 500 });
    await completarPrecios(s.id, { R: 600 });
    state = await snapshot();
    expect(ganancia(state.paquetes, state.movimientos).ganancia).toBe(1290);
    expect(state.viajes[0]!.estado).toBe('CERRADO');
    expect(state.movimientos.every((m) => m.estado === 'TERMINADO')).toBe(true);
    expect(state.paquetes[0]!.estado).toBe('VENDIDO');
    expect(await db.sync_queue.count()).toBe(pending + 2);
    await expect(completarPrecios(c.id, { P: 700 })).rejects.toThrow('ya se asignaron una vez');
    db.close();
    await db.open();
    await expect(completarPrecios(s.id, { R: 650 })).rejects.toThrow('ya se asignaron una vez');
  });
  it('conserva precios existentes incluido cero, exige los tipos usados y serializa asignaciones concurrentes', async () => {
    await iniciarViaje();
    const c = await crearMovimiento({
      tipo: 'COMPRA',
      nombre: 'Parcial',
      fecha: '2026-10-23',
      precios: { R: 0 },
    });
    await agregarPeso(c.id, 'P', 2000);
    await expect(completarPrecios(c.id, { R: 500 })).rejects.toThrow('ya está asignado');
    await expect(completarPrecios(c.id, { J: 500 })).rejects.toThrow('todos los tipos');
    await expect(completarPrecios(c.id, { P: 5.55 })).rejects.toThrow('céntimos enteros');
    await expect(completarPrecios(c.id, {})).rejects.toThrow('al menos un precio');
    const pending = await db.sync_queue.count();
    const results = await Promise.allSettled([
      completarPrecios(c.id, { P: 500 }),
      completarPrecios(c.id, { P: 600 }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await db.movimientos.get(c.id))!.precios.R).toBe(0);
    expect(await db.sync_queue.count()).toBe(pending + 1);
  });
  it('revierte precios y permiso de asignación si falla la cola', async () => {
    await iniciarViaje();
    const c = await crearMovimiento({
      tipo: 'COMPRA',
      nombre: 'Atomicidad',
      fecha: '2026-10-23',
      precios: {},
    });
    const fail = () => {
      throw new Error('Fallo al encolar');
    };
    db.sync_queue.hook('creating', fail);
    await expect(completarPrecios(c.id, { R: 500 })).rejects.toThrow('Fallo al encolar');
    db.sync_queue.hook('creating').unsubscribe(fail);
    expect((await db.movimientos.get(c.id))!.precios_completados_at).toBeUndefined();
    expect((await db.movimientos.get(c.id))!.precios).toEqual({});
    await completarPrecios(c.id, { R: 500 });
  });
  it('distingue pesos vendidos en otro movimiento y pesos disponibles en otra granja', async () => {
    await iniciarViaje();
    const c = await compra();
    await agregarPeso(c.id, 'R', 1290);
    await terminarMovimiento(c.id);
    const s = await venta();
    await marcarPeso(s.id, 'R', c.parte_id, 1290);
    await terminarMovimiento(s.id);
    const otraVenta = await venta();
    await expect(marcarPeso(otraVenta.id, 'R', c.parte_id, 1290)).rejects.toThrow(
      'otro movimiento',
    );
    const otraGranja = await compra('Otra granja');
    await agregarPeso(otraGranja.id, 'R', 2145);
    await terminarMovimiento(otraGranja.id);
    await expect(marcarPeso(otraVenta.id, 'R', c.parte_id, 2145)).rejects.toThrow('otra granja');
    await expect(marcarPeso(otraVenta.id, 'R', c.parte_id, 9999)).rejects.toThrow('No existe');
  });
  it('serializa aperturas concurrentes y reapertura', async () => {
    const results = await Promise.allSettled([iniciarViaje(), iniciarViaje()]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const v = (await snapshot()).viajes[0]!;
    await cerrarViaje(v.id);
    await iniciarViaje();
    await expect(reabrirViaje(v.id)).rejects.toThrow('otro viaje');
  });
  it('exige terminar movimientos y conserva stock entre viajes', async () => {
    const v = await iniciarViaje();
    const c = await compra();
    await agregarPeso(c.id, 'R', 2145);
    await expect(cerrarViaje(v.id)).rejects.toThrow('movimientos');
    await terminarMovimiento(c.id);
    await cerrarViaje(v.id);
    await iniciarViaje();
    expect((await snapshot()).paquetes[0]!.estado).toBe('EN_CAMION');
    await expect(agregarPeso(c.id, 'R', 1500)).rejects.toThrow();
  });
  it('marca FIFO por fecha de compra, evita doble reserva y distingue errores', async () => {
    await iniciarViaje();
    const nueva = await compra('Granja Águila', '2026-10-23');
    const pNueva = await agregarPeso(nueva.id, 'R', 1290);
    await terminarMovimiento(nueva.id);
    const vieja = await compra('Granja Águila', '2026-10-22');
    const pVieja = await agregarPeso(vieja.id, 'R', 1290);
    await terminarMovimiento(vieja.id);
    const s = await venta();
    expect((await marcarPeso(s.id, 'R', vieja.parte_id, 1290)).paquete.id).toBe(pVieja.id);
    expect((await marcarPeso(s.id, 'R', vieja.parte_id, 1290)).mensaje).toContain('Ya van 2');
    await expect(marcarPeso(s.id, 'R', vieja.parte_id, 1290)).rejects.toThrow('Ya marcaste los 2');
    expect(await db.paquetes.count()).toBe(2);
    await deshacerPeso(s.id, pNueva.id);
    const otra = await venta();
    const concurrent = await Promise.allSettled([
      marcarPeso(s.id, 'R', vieja.parte_id, 1290),
      marcarPeso(otra.id, 'R', vieja.parte_id, 1290),
    ]);
    expect(concurrent.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    await cancelarMovimiento(otra.id);
    await cancelarMovimiento(s.id);
    expect((await snapshot()).paquetes.every((p) => p.estado === 'EN_CAMION')).toBe(true);
  });
  it('termina 300 paquetes atómicamente, encola cada cambio y protege terminados', async () => {
    await iniciarViaje();
    const s = await crearMovimiento({
      tipo: 'VENTA',
      nombre: 'Sin compra',
      fecha: '2026-10-23',
      precios: {},
      tiene_pesos_compra: false,
    });
    for (let i = 0; i < 300; i++) await agregarPeso(s.id, 'R', 2000 + i);
    const before = await db.sync_queue.count();
    await terminarMovimiento(s.id);
    expect((await snapshot()).paquetes.filter((p) => p.estado === 'VENDIDO')).toHaveLength(300);
    expect(await db.sync_queue.count()).toBe(before + 301);
    await expect(cancelarMovimiento(s.id)).rejects.toThrow();
  });
  it('revierte entidad si falla encolar y rechaza valores inválidos', async () => {
    const fail = () => {
      throw new Error('Cola no disponible');
    };
    db.sync_queue.hook('creating', fail);
    await expect(iniciarViaje()).rejects.toThrow('Cola');
    db.sync_queue.hook('creating').unsubscribe(fail);
    expect(await db.viajes.count()).toBe(0);
    await iniciarViaje();
    const c = await compra();
    await expect(agregarPeso(c.id, 'R', 21.45)).rejects.toThrow();
    await expect(
      crearMovimiento({
        tipo: 'FLETE',
        nombre: 'Flete',
        fecha: '2026-10-23',
        precios: {},
        cantidades: { R: -1 },
      }),
    ).rejects.toThrow();
  });
  it('revierte una confirmación fallida sin vender paquetes parcialmente', async () => {
    await iniciarViaje();
    const m = await crearMovimiento({
      tipo: 'VENTA',
      nombre: 'Atómica',
      fecha: '2026-10-23',
      precios: {},
      tiene_pesos_compra: false,
    });
    for (let i = 0; i < 3; i++) await agregarPeso(m.id, 'R', 2145);
    const before = await db.sync_queue.count();
    let updated = 0;
    const fail = () => {
      if (++updated === 2) throw new Error('Fallo de almacenamiento');
    };
    db.paquetes.hook('updating', fail);
    await expect(terminarMovimiento(m.id)).rejects.toThrow('Fallo');
    db.paquetes.hook('updating').unsubscribe(fail);
    expect((await db.movimientos.get(m.id))!.estado).toBe('EN_CURSO');
    expect((await snapshot()).paquetes.every((p) => p.estado === 'EN_VENTA')).toBe(true);
    expect(await db.sync_queue.count()).toBe(before);
  });
});

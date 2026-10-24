import { beforeEach, describe, expect, it, vi } from 'vitest';
import { offlineDatabase as db } from '@/db/database';
import * as repository from '@/repositories/transporte';
import { addMovimientoToDexie, proyectarViaje } from './viajes.api';

beforeEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
  await db.open();
});

describe('creación y proyección del viaje', () => {
  it('confirma los tres tipos sin releer el historial y conserva sus transacciones y cola', async () => {
    await repository.iniciarViaje();
    const snapshot = vi.spyOn(repository, 'snapshot');
    for (const tipo of ['compra', 'venta', 'flete'] as const) {
      const result = await addMovimientoToDexie({
        tipo,
        fecha: '24/10/2026',
        entidad: `Parte ${tipo}`,
        rosadoPrecio: 5,
        pardoPrecio: undefined,
        jumboPrecio: undefined,
        kilosTotal: 0,
        paquetesTotal: 0,
        montoTotal: 0,
        ...(tipo === 'flete' ? { paquetesRosados: 7 } : {}),
      });
      expect(snapshot).not.toHaveBeenCalled();
      expect(result.id).toBeTruthy();
      const saved = await db.movimientos.get(result.id!);
      expect(saved?.tipo).toBe(tipo.toUpperCase());
      expect(
        await db.sync_queue.where('[tabla+entidad_id]').equals(['movimientos', result.id!]).count(),
      ).toBe(1);
      expect(result.paquetesTotal).toBe(tipo === 'flete' ? 7 : 0);
      if (tipo === 'flete')
        expect(await db.flete_lineas.where('movimiento_id').equals(result.id!).count()).toBe(1);
    }
  });

  it('conserva ganancias, remanente entre viajes, históricos y cantidades de flete', async () => {
    const first = await repository.iniciarViaje();
    const compra = await repository.crearMovimiento({
      tipo: 'COMPRA',
      nombre: 'Granja',
      fecha: '2026-10-23',
      precios: { R: 500 },
    });
    await repository.agregarPeso(compra.id, 'R', 2145);
    await repository.agregarPeso(compra.id, 'R', 2245);
    await repository.terminarMovimiento(compra.id);
    await repository.cerrarViaje(first.id);
    const second = await repository.iniciarViaje();
    const venta = await repository.crearMovimiento({
      tipo: 'VENTA',
      nombre: 'Cliente',
      fecha: '2026-10-24',
      precios: { R: 600 },
    });
    await repository.marcarPeso(venta.id, 'R', compra.parte_id, 2145);
    await repository.terminarMovimiento(venta.id);
    const flete = await repository.crearMovimiento({
      tipo: 'FLETE',
      nombre: 'Flete',
      fecha: '2026-10-24',
      precios: {},
      cantidades: { R: 3, J: 2 },
    });
    const state = await repository.snapshot();
    const current = proyectarViaje(state, second.id);
    expect(current.resumen).toMatchObject({
      compradoKg: 0,
      vendidoKg: 21.45,
      vendidoPaq: 1,
      enCamionKg: 22.45,
      totalMovimientos: 2,
    });
    expect(current.movimientos.find((m) => m.id === venta.id)).toMatchObject({
      montoTotal: 128.7,
      gananciaC: 2145,
      excluidos: 0,
    });
    expect(current.movimientos.find((m) => m.id === flete.id)).toMatchObject({
      paquetesTotal: 5,
      paquetesRosados: 3,
      paquetesJumbos: 2,
    });
    const previous = proyectarViaje(state, first.id);
    expect(previous.resumen.compradoKg).toBe(43.9);
    expect(previous.resumen.vendidoKg).toBe(0);
    state.movimientos.find((m) => m.id === compra.id)!.legacy_resumen = {
      peso_c: 10000,
      paquetes: 4,
      importe_c: 45000,
    };
    expect(proyectarViaje(state, first.id).movimientos[0]).toMatchObject({
      kilosTotal: 100,
      paquetesTotal: 4,
      montoTotal: 450,
    });
  });
});

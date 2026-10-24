import { beforeEach, expect, it } from 'vitest';
import { offlineDatabase as db } from '@/db/database';
import * as repository from '@/repositories/transporte';
import { proyectarMovimientos } from '../api';
import { filtrarMovimientos, type FiltrosMovimientos } from './useMovimientos';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

it('busca partes de cualquier rol y ventas relacionadas entre viajes, conservando filtros y totales', async () => {
  const viaje = await repository.iniciarViaje();
  const compra = await repository.crearMovimiento({
    tipo: 'COMPRA',
    nombre: 'Granja Águila',
    fecha: '2026-10-23',
    precios: { R: 500 },
  });
  await repository.agregarPeso(compra.id, 'R', 2145);
  await repository.terminarMovimiento(compra.id);
  await repository.cerrarViaje(viaje.id);
  const segundo = await repository.iniciarViaje();
  const venta = await repository.crearMovimiento({
    tipo: 'VENTA',
    nombre: 'Cliente Lima',
    fecha: '2026-10-24',
    precios: { R: 600 },
  });
  await repository.marcarPeso(venta.id, 'R', compra.parte_id, 2145);
  await repository.terminarMovimiento(venta.id);
  const flete = await repository.crearMovimiento({
    tipo: 'FLETE',
    nombre: 'Cliente Lima',
    fecha: '2026-10-24',
    precios: {},
    cantidades: { R: 5 },
  });
  const state = await repository.snapshot();
  const lista = proyectarMovimientos(state);
  expect(lista).toHaveLength(3);
  expect(lista.at(-1)).toMatchObject({
    id: compra.id,
    viajeId: viaje.id,
    kilosTotal: 21.45,
    montoTotal: 107.25,
  });
  expect(lista.find((m) => m.id === venta.id)).toMatchObject({
    viajeId: segundo.id,
    gananciaC: 2145,
  });
  expect(lista.find((m) => m.id === flete.id)?.paquetesTotal).toBe(5);
  const filtros: FiltrosMovimientos = { q: 'AGUILA', desde: '', hasta: '', tipo: '', estado: '' };
  const buscar = (patch: Partial<FiltrosMovimientos>) =>
    filtrarMovimientos(lista, state, { ...filtros, ...patch }).map((m) => m.id);
  expect(buscar({})).toEqual([venta.id, compra.id]);
  expect(new Set(buscar({ q: 'lima' }))).toEqual(new Set([venta.id, flete.id]));
  expect(
    buscar({ desde: '2026-10-24', hasta: '2026-10-24', tipo: 'venta', estado: 'TERMINADO' }),
  ).toEqual([venta.id]);
  expect(buscar({ hasta: '2026-10-23' })).toEqual([compra.id]);
  expect(buscar({ q: 'inexistente' })).toEqual([]);
  expect(buscar({ desde: '2026-10-25', hasta: '2026-10-23' })).toEqual([]);
});

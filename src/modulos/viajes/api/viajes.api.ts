import { crearMovimiento, cancelarMovimiento, snapshot } from '@/repositories/transporte';
import { costoPaquete, ganancia } from '@/domain/ganancia';
import { fechaVisible, type Movimiento as Entity } from '@/domain/model';
import type { Movimiento, ViajeResumen } from '../types';

function adapter(m: Entity, state: Awaited<ReturnType<typeof snapshot>>): Movimiento {
  const paquetes = state.paquetes.filter((p) =>
    m.tipo === 'COMPRA' ? p.compra_mov_id === m.id : p.venta_mov_id === m.id,
  );
  const fletes = state.fletes.filter((f) => f.movimiento_id === m.id);
  return {
    id: m.id,
    tipo: m.tipo.toLowerCase() as Movimiento['tipo'],
    fecha: fechaVisible(m.fecha),
    entidad: state.partes.find((p) => p.id === m.parte_id)?.nombre ?? 'Sin nombre',
    rosadoPrecio: (m.precios.R ?? 0) / 100,
    pardoPrecio: (m.precios.P ?? 0) / 100,
    jumboPrecio: (m.precios.J ?? 0) / 100,
    kilosTotal: (m.legacy_resumen?.peso_c ?? paquetes.reduce((s, p) => s + p.peso_c, 0)) / 100,
    paquetesTotal:
      m.legacy_resumen?.paquetes ??
      (m.tipo === 'FLETE' ? fletes.reduce((s, f) => s + f.cantidad, 0) : paquetes.length),
    paquetesRosados: fletes.find((f) => f.tipo === 'R')?.cantidad ?? 0,
    paquetesPardos: fletes.find((f) => f.tipo === 'P')?.cantidad ?? 0,
    paquetesJumbos: fletes.find((f) => f.tipo === 'J')?.cantidad ?? 0,
    montoTotal:
      (m.legacy_resumen?.importe_c ??
        paquetes.reduce((s, p) => s + costoPaquete(p.peso_c, m.precios[p.tipo] ?? 0), 0)) / 100,
    tienePesosCompra: m.tiene_pesos_compra,
    createdAt: Date.parse(m.created_at),
    estado: m.estado,
    gananciaC: ganancia(paquetes, state.movimientos, true).ganancia,
    excluidos: ganancia(paquetes, state.movimientos, true).excluidos,
  };
}
export async function listMovimientosFromDexie(viajeId?: string): Promise<Movimiento[]> {
  const state = await snapshot();
  const id = viajeId ?? state.viajes.find((v) => v.estado === 'ABIERTO')?.id;
  return state.movimientos
    .filter((m) => m.viaje_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((m) => adapter(m, state));
}
export async function addMovimientoToDexie(
  data: Omit<Movimiento, 'id' | 'createdAt'>,
): Promise<Movimiento> {
  const parts = data.fecha.split('/');
  const fecha =
    parts.length === 3
      ? `${parts[2]}-${parts[1]!.padStart(2, '0')}-${parts[0]!.padStart(2, '0')}`
      : data.fecha;
  const precios: Entity['precios'] = {};
  for (const [t, p] of [
    ['R', data.rosadoPrecio],
    ['P', data.pardoPrecio],
    ['J', data.jumboPrecio],
  ] as const) {
    if (p !== undefined && p !== null && String(p) !== '') {
      if (!Number.isFinite(p) || p < 0 || Math.abs(p * 100 - Math.round(p * 100)) > 0.000001)
        throw new Error('Usa precios positivos con hasta dos decimales.');
      precios[t] = Math.round(p * 100);
    }
  }
  const m = await crearMovimiento({
    tipo: data.tipo.toUpperCase() as Entity['tipo'],
    nombre: data.entidad,
    fecha,
    precios,
    tiene_pesos_compra: data.tienePesosCompra ?? true,
    cantidades: {
      R: data.paquetesRosados ?? 0,
      P: data.paquetesPardos ?? 0,
      J: data.paquetesJumbos ?? 0,
    },
  });
  return adapter(m, await snapshot());
}
export const deleteMovimientoFromDexie = cancelarMovimiento;
export function updateFleteFromDexie(_id: string, _data: unknown): Promise<void> {
  void _id;
  void _data;
  return Promise.reject(new Error('Los movimientos terminados son de solo lectura.'));
}
export async function getTripSummaryFromDexie(viajeId?: string): Promise<ViajeResumen> {
  const state = await snapshot();
  const v =
    state.viajes.find((v) => v.id === viajeId) ?? state.viajes.find((v) => v.estado === 'ABIERTO');
  const movimientos = v ? await listMovimientosFromDexie(v.id) : [];
  const compras = movimientos.filter((m) => m.tipo === 'compra');
  const ventas = movimientos.filter((m) => m.tipo === 'venta' && m.estado === 'TERMINADO');
  const stock = state.paquetes.filter((p) => p.estado !== 'VENDIDO');
  return {
    fecha: v ? fechaVisible(v.fecha_inicio) : 'Sin viaje',
    origen: 'Chincha',
    destino: 'Lima',
    estado: v?.estado === 'ABIERTO' ? 'En curso' : 'Cerrado',
    compradoKg: compras.reduce((s, m) => s + m.kilosTotal, 0),
    compradoPaq: compras.reduce((s, m) => s + m.paquetesTotal, 0),
    vendidoKg: ventas.reduce((s, m) => s + m.kilosTotal, 0),
    vendidoPaq: ventas.reduce((s, m) => s + m.paquetesTotal, 0),
    enCamionKg: stock.reduce((s, p) => s + p.peso_c, 0) / 100,
    enCamionPaq: stock.length,
    totalMovimientos: movimientos.length,
  };
}

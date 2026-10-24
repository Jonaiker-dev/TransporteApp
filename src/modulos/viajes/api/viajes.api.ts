import {
  crearMovimiento,
  cancelarMovimiento,
  snapshot,
  type Snapshot,
} from '@/repositories/transporte';
import { costoPaquete, ganancia } from '@/domain/ganancia';
import {
  fechaVisible,
  type Movimiento as Entity,
  type Paquete,
  type FleteLinea,
} from '@/domain/model';
import type { Movimiento, ViajeResumen } from '../types';

function indexar(state: Snapshot) {
  const paquetes = new Map<string, Paquete[]>();
  const fletes = new Map<string, FleteLinea[]>();
  for (const p of state.paquetes) {
    for (const id of [p.compra_mov_id, p.venta_mov_id]) {
      if (!id) continue;
      const group = paquetes.get(id) ?? [];
      group.push(p);
      paquetes.set(id, group);
    }
  }
  for (const f of state.fletes) {
    const group = fletes.get(f.movimiento_id) ?? [];
    group.push(f);
    fletes.set(f.movimiento_id, group);
  }
  return {
    paquetes,
    fletes,
    partes: new Map(state.partes.map((p) => [p.id, p])),
    movimientos: new Map(state.movimientos.map((m) => [m.id, m])),
  };
}

function adapter(m: Entity, indice: ReturnType<typeof indexar>): Movimiento {
  const paquetes = indice.paquetes.get(m.id) ?? [];
  const fletes = indice.fletes.get(m.id) ?? [];
  const relacionados = new Set<string>();
  for (const p of paquetes) {
    if (p.compra_mov_id) relacionados.add(p.compra_mov_id);
    if (p.venta_mov_id) relacionados.add(p.venta_mov_id);
  }
  const resultado = ganancia(
    paquetes,
    [...relacionados].flatMap((id) => {
      const movimiento = indice.movimientos.get(id);
      return movimiento ? [movimiento] : [];
    }),
    true,
  );
  return {
    id: m.id,
    tipo: m.tipo.toLowerCase() as Movimiento['tipo'],
    fecha: fechaVisible(m.fecha),
    entidad: indice.partes.get(m.parte_id)?.nombre ?? 'Sin nombre',
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
    gananciaC: resultado.ganancia,
    excluidos: resultado.excluidos,
  };
}
export async function listMovimientosFromDexie(viajeId?: string): Promise<Movimiento[]> {
  return proyectarViaje(await snapshot(), viajeId).movimientos;
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
  // A newly created movement has no captured weights. Return the committed
  // result without rereading the full history before opening its screen.
  return {
    ...data,
    id: m.id,
    entidad: data.entidad.trim(),
    fecha: fechaVisible(m.fecha),
    createdAt: Date.parse(m.created_at),
    estado: m.estado,
    tienePesosCompra: m.tiene_pesos_compra,
    kilosTotal: 0,
    paquetesTotal:
      m.tipo === 'FLETE'
        ? (data.paquetesRosados ?? 0) + (data.paquetesPardos ?? 0) + (data.paquetesJumbos ?? 0)
        : 0,
    montoTotal: 0,
    gananciaC: 0,
    excluidos: 0,
  };
}
export const deleteMovimientoFromDexie = cancelarMovimiento;
export function updateFleteFromDexie(_id: string, _data: unknown): Promise<void> {
  void _id;
  void _data;
  return Promise.reject(new Error('Los movimientos terminados son de solo lectura.'));
}
export async function getTripSummaryFromDexie(viajeId?: string): Promise<ViajeResumen> {
  return proyectarViaje(await snapshot(), viajeId).resumen;
}

// One coherent local snapshot feeds both the list and its totals. This also
// avoids async reloads racing to replace a newer list with an older one.
export function proyectarViaje(state: Snapshot, viajeId?: string) {
  const v =
    state.viajes.find((v) => v.id === viajeId) ?? state.viajes.find((v) => v.estado === 'ABIERTO');
  const indice = indexar(state);
  const movimientos = state.movimientos
    .filter((m) => m.viaje_id === (viajeId ?? v?.id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((m) => adapter(m, indice));
  const compras = movimientos.filter((m) => m.tipo === 'compra');
  const ventas = movimientos.filter((m) => m.tipo === 'venta' && m.estado === 'TERMINADO');
  const stock = state.paquetes.filter((p) => p.estado !== 'VENDIDO');
  const resumen: ViajeResumen = {
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
  return { movimientos, resumen };
}

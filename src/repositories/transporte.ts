import { liveQuery } from 'dexie';
import { offlineDatabase as db } from '../db/database';
import {
  metadata,
  normalizarNombre,
  fechaLima,
  tipos,
  type Entidad,
  type Tabla,
  type Viaje,
  type Parte,
  type Movimiento,
  type Paquete,
  type TipoHuevo,
  type FleteLinea,
} from '../domain/model';

const active = <T extends { deleted_at: string | null }>(items: T[]) =>
  items.filter((p) => !p.deleted_at);
const tables = () => [
  db.viajes,
  db.partes,
  db.movimientos,
  db.paquetes,
  db.flete_lineas,
  db.sync_queue,
  db.settings,
];
export const atomic = <T>(fn: () => Promise<T>) => db.transaction('rw', tables(), fn);

// Always call inside atomic(): entity and durable outbox commit together.
export async function guardar(
  tabla: Tabla,
  entity: Entidad,
  movimientoId: string | null = null,
): Promise<void> {
  entity.updated_at = new Date().toISOString();
  entity.synced_at = null;
  await db.table<Entidad, string>(tabla).put(entity);
  await db.sync_queue.add({
    tabla,
    entidad_id: entity.id,
    operacion: 'upsert',
    movimiento_id: movimientoId,
    intentos: 0,
    ultimo_error: null,
    siguiente_intento: 0,
  });
}
export async function snapshot() {
  return db.transaction('r', tables(), async () => ({
    viajes: active(await db.viajes.toArray()).sort(
      (a, b) =>
        b.fecha_inicio.localeCompare(a.fecha_inicio) || b.created_at.localeCompare(a.created_at),
    ),
    partes: active(await db.partes.toArray()),
    movimientos: active(await db.movimientos.toArray()),
    paquetes: active(await db.paquetes.toArray()),
    fletes: active(await db.flete_lineas.toArray()),
    pendientes: await db.sync_queue.count(),
  }));
}
export type Snapshot = Awaited<ReturnType<typeof snapshot>>;
export function observar(next: (state: Snapshot) => void, error: (err: unknown) => void) {
  return liveQuery(snapshot).subscribe({ next, error });
}
export async function iniciarViaje(): Promise<Viaje> {
  return atomic(async () => {
    if (
      await db.viajes
        .where('estado')
        .equals('ABIERTO')
        .filter((v) => !v.deleted_at)
        .count()
    )
      throw new Error('Ya hay un viaje abierto.');
    const viaje: Viaje = {
      ...metadata(),
      fecha_inicio: fechaLima(),
      fecha_fin: null,
      estado: 'ABIERTO',
      nota: '',
    };
    await guardar('viajes', viaje);
    return viaje;
  });
}
export async function cerrarViaje(id: string): Promise<void> {
  return atomic(async () => {
    const v = await db.viajes.get(id);
    if (!v || v.deleted_at || v.estado !== 'ABIERTO') throw new Error('El viaje no está abierto.');
    if (
      await db.movimientos
        .where('viaje_id')
        .equals(id)
        .filter((m) => !m.deleted_at && m.estado === 'EN_CURSO')
        .count()
    )
      throw new Error('Termina o cancela los movimientos en curso antes de cerrar.');
    v.estado = 'CERRADO';
    v.fecha_fin = fechaLima();
    await guardar('viajes', v);
  });
}
export async function reabrirViaje(id: string): Promise<void> {
  return atomic(async () => {
    if (
      await db.viajes
        .where('estado')
        .equals('ABIERTO')
        .filter((v) => !v.deleted_at)
        .count()
    )
      throw new Error('Cierra el otro viaje antes de reabrir este.');
    const v = await db.viajes.get(id);
    if (!v || v.deleted_at || v.estado !== 'CERRADO') throw new Error('Viaje no disponible.');
    v.estado = 'ABIERTO';
    v.fecha_fin = null;
    await guardar('viajes', v);
  });
}
async function parteEnTransaccion(nombre: string, rol: Parte['roles'][number]): Promise<Parte> {
  const nombre_norm = normalizarNombre(nombre);
  if (!nombre_norm) throw new Error('Escribe un nombre.');
  const existing = await db.partes.where('nombre_norm').equals(nombre_norm).first();
  const p: Parte = existing ?? { ...metadata(), nombre: nombre.trim(), nombre_norm, roles: [] };
  if (p.deleted_at) throw new Error('La parte fue eliminada.');
  if (!p.roles.includes(rol)) {
    p.roles.push(rol);
    await guardar('partes', p);
  }
  return p;
}
export const crearParte = (nombre: string, rol: Parte['roles'][number]) =>
  atomic(() => parteEnTransaccion(nombre, rol));
export async function listarPartes(rol: Parte['roles'][number]) {
  return active(await db.partes.where('roles').equals(rol).toArray()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es'),
  );
}
export async function crearMovimiento(input: {
  tipo: Movimiento['tipo'];
  fecha: string;
  nombre: string;
  precios: Movimiento['precios'];
  tiene_pesos_compra?: boolean;
  cantidades?: Partial<Record<TipoHuevo, number>>;
}): Promise<Movimiento> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.fecha) ||
    !Number.isFinite(Date.parse(input.fecha)) ||
    new Date(`${input.fecha}T12:00:00Z`).toISOString().slice(0, 10) !== input.fecha
  )
    throw new Error('La fecha no es válida.');
  for (const value of Object.values(input.precios))
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('Precio inválido. Usa hasta dos decimales.');
  return atomic(async () => {
    const viaje = await db.viajes
      .where('estado')
      .equals('ABIERTO')
      .filter((v) => !v.deleted_at)
      .first();
    if (!viaje) throw new Error('Inicia un viaje antes de crear un movimiento.');
    const parte = await parteEnTransaccion(
      input.nombre,
      input.tipo === 'COMPRA' ? 'GRANJA' : input.tipo === 'VENTA' ? 'CLIENTE' : 'FLETE',
    );
    const m: Movimiento = {
      ...metadata(),
      viaje_id: viaje.id,
      tipo: input.tipo,
      fecha: input.fecha,
      parte_id: parte.id,
      precios: input.precios,
      tiene_pesos_compra: input.tiene_pesos_compra ?? true,
      estado: input.tipo === 'FLETE' ? 'TERMINADO' : 'EN_CURSO',
    };
    if (input.tipo === 'FLETE') {
      const cantidades = tipos.map((tipo) => ({ tipo, cantidad: input.cantidades?.[tipo] ?? 0 }));
      if (
        cantidades.some((l) => !Number.isSafeInteger(l.cantidad) || l.cantidad < 0) ||
        !cantidades.some((l) => l.cantidad > 0)
      )
        throw new Error('Ingresa al menos un paquete y cantidades enteras.');
      for (const linea of cantidades.filter((l) => l.cantidad > 0))
        await guardar('flete_lineas', { ...metadata(), movimiento_id: m.id, ...linea }, m.id);
    }
    await guardar('movimientos', m, m.id);
    return m;
  });
}
async function editable(id: string): Promise<Movimiento> {
  const m = await db.movimientos.get(id);
  if (!m || m.deleted_at || m.estado !== 'EN_CURSO')
    throw new Error('El movimiento está terminado o no existe.');
  const viaje = await db.viajes.get(m.viaje_id);
  if (viaje?.estado !== 'ABIERTO') throw new Error('El viaje está cerrado.');
  return m;
}
export async function agregarPeso(id: string, tipo: TipoHuevo, peso_c: number): Promise<Paquete> {
  if (!tipos.includes(tipo) || !Number.isSafeInteger(peso_c) || peso_c <= 0 || peso_c > 99999999)
    throw new Error('Ingresa un peso mayor que cero y con dos decimales.');
  return atomic(async () => {
    const m = await editable(id);
    if (m.tipo === 'FLETE' || (m.tipo === 'VENTA' && m.tiene_pesos_compra))
      throw new Error('Esta venta requiere marcar un paquete existente.');
    const counter = await db.settings.get('orden_captura');
    const orden = Number(counter?.value ?? 0) + 1;
    await db.settings.put({ key: 'orden_captura', value: String(orden) });
    const p: Paquete = {
      ...metadata(),
      tipo,
      peso_c,
      orden_captura: orden,
      granja_id: m.tipo === 'COMPRA' ? m.parte_id : null,
      compra_mov_id: m.tipo === 'COMPRA' ? m.id : null,
      venta_mov_id: m.tipo === 'VENTA' ? m.id : null,
      estado: m.tipo === 'COMPRA' ? 'EN_CAMION' : 'EN_VENTA',
      origen: m.tipo === 'COMPRA' ? 'COMPRA' : 'VENTA_SIN_COMPRA',
    };
    await guardar('paquetes', p, m.id);
    return p;
  });
}
export async function marcarPeso(
  id: string,
  tipo: TipoHuevo,
  granja: string,
  peso: number,
): Promise<{ paquete: Paquete; mensaje: string }> {
  return atomic(async () => {
    const m = await editable(id);
    if (m.tipo !== 'VENTA' || !m.tiene_pesos_compra || !granja)
      throw new Error('Selecciona una granja para marcar pesos.');
    const all = active(await db.paquetes.toArray()).filter(
      (p) => p.tipo === tipo && p.peso_c === peso,
    );
    const local = all.filter((p) => p.granja_id === granja);
    const compras = new Map((await db.movimientos.toArray()).map((c) => [c.id, c]));
    const disponibles = local
      .filter(
        (p) =>
          p.estado === 'EN_CAMION' &&
          p.compra_mov_id &&
          compras.get(p.compra_mov_id)?.estado === 'TERMINADO' &&
          !compras.get(p.compra_mov_id)?.deleted_at,
      )
      .sort(
        (a, b) =>
          compras
            .get(a.compra_mov_id!)!
            .fecha.localeCompare(compras.get(b.compra_mov_id!)!.fecha) ||
          a.orden_captura - b.orden_captura,
      );
    const p = disponibles[0];
    const marcados = local.filter((p) => p.venta_mov_id === id && p.estado === 'EN_VENTA').length;
    if (!p) {
      if (
        marcados &&
        !local.some(
          (item) =>
            item.venta_mov_id !== id && (item.estado === 'VENDIDO' || item.estado === 'EN_VENTA'),
        )
      )
        throw new Error(
          `Ya marcaste los ${marcados} de ${(peso / 100).toFixed(2)} kg en esta venta.`,
        );
      if (local.some((p) => p.estado === 'VENDIDO' || p.estado === 'EN_VENTA'))
        throw new Error('Ese peso ya se vendió o está reservado en otro movimiento.');
      if (local.some((p) => p.estado === 'EN_CAMION'))
        throw new Error('Termina la compra de ese paquete antes de venderlo.');
      throw new Error(
        `No existe ese peso en esta granja y tipo.${all.some((p) => p.granja_id !== granja && p.estado === 'EN_CAMION') ? ' Existe en otra granja.' : ''}`,
      );
    }
    p.estado = 'EN_VENTA';
    p.venta_mov_id = id;
    const counter = await db.settings.get('orden_captura');
    p.orden_venta = Number(counter?.value ?? 0) + 1;
    await db.settings.put({ key: 'orden_captura', value: String(p.orden_venta) });
    await guardar('paquetes', p, id);
    return {
      paquete: p,
      mensaje: `Ya van ${marcados + 1} de ${(peso / 100).toFixed(2)} kg en esta venta · quedan ${disponibles.length - 1}`,
    };
  });
}
// Exception to read-only finished movements: missing prices may be filled once,
// without touching existing prices, package states or the trip lifecycle.
export async function completarPrecios(id: string, precios: Movimiento['precios']): Promise<void> {
  const keys = Object.keys(precios);
  if (!keys.length || keys.some((key) => !tipos.includes(key as TipoHuevo)))
    throw new Error('Ingresa al menos un precio válido.');
  for (const value of Object.values(precios)) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('Los precios deben ser céntimos enteros iguales o mayores que cero.');
  }
  return atomic(async () => {
    const m = await db.movimientos.get(id);
    if (!m || m.deleted_at || m.tipo === 'FLETE') throw new Error('Compra o venta no disponible.');
    if (m.precios_completados_at) throw new Error('Los precios faltantes ya se asignaron una vez.');
    for (const key of keys as TipoHuevo[])
      if (m.precios[key] !== undefined)
        throw new Error(`El precio de ${key} ya está asignado y no se puede cambiar.`);
    const paquetes = active(
      await db.paquetes
        .where(m.tipo === 'COMPRA' ? 'compra_mov_id' : 'venta_mov_id')
        .equals(id)
        .toArray(),
    );
    if (paquetes.some((p) => m.precios[p.tipo] === undefined && precios[p.tipo] === undefined))
      throw new Error('Completa los precios de todos los tipos registrados en este movimiento.');
    m.precios = { ...m.precios, ...precios };
    m.precios_completados_at = new Date().toISOString();
    await guardar('movimientos', m, m.id);
  });
}
export async function deshacerPeso(movimientoId: string, paqueteId: string): Promise<void> {
  return atomic(async () => {
    const m = await editable(movimientoId);
    const p = await db.paquetes.get(paqueteId);
    if (!p || p.deleted_at) throw new Error('Paquete no disponible.');
    if (m.tipo === 'COMPRA') {
      if (p.compra_mov_id !== m.id || p.estado !== 'EN_CAMION')
        throw new Error('El paquete ya se reservó o vendió.');
      p.deleted_at = new Date().toISOString();
    } else {
      if (p.venta_mov_id !== m.id || p.estado !== 'EN_VENTA')
        throw new Error('El paquete no pertenece a esta venta.');
      if (p.origen === 'VENTA_SIN_COMPRA') p.deleted_at = new Date().toISOString();
      else {
        p.estado = 'EN_CAMION';
        p.venta_mov_id = null;
      }
    }
    await guardar('paquetes', p, m.id);
  });
}
export async function terminarMovimiento(id: string): Promise<void> {
  return atomic(async () => {
    const m = await editable(id);
    const paquetes = active(
      await db.paquetes
        .where(m.tipo === 'COMPRA' ? 'compra_mov_id' : 'venta_mov_id')
        .equals(id)
        .toArray(),
    );
    if (!paquetes.length) throw new Error('Registra al menos un peso antes de terminar.');
    for (const p of paquetes)
      if (m.tipo === 'VENTA') {
        p.estado = 'VENDIDO';
        await guardar('paquetes', p, id);
      }
    m.estado = 'TERMINADO';
    await guardar('movimientos', m, id);
  });
}
export async function cancelarMovimiento(id: string): Promise<void> {
  return atomic(async () => {
    const m = await editable(id);
    const paquetes = active(
      await db.paquetes
        .where(m.tipo === 'COMPRA' ? 'compra_mov_id' : 'venta_mov_id')
        .equals(id)
        .toArray(),
    );
    for (const p of paquetes) {
      if (m.tipo === 'COMPRA' && p.estado !== 'EN_CAMION')
        throw new Error('Hay paquetes de esta compra en una venta.');
      if (m.tipo === 'COMPRA' || p.origen === 'VENTA_SIN_COMPRA')
        p.deleted_at = new Date().toISOString();
      else {
        p.estado = 'EN_CAMION';
        p.venta_mov_id = null;
      }
      await guardar('paquetes', p, id);
    }
    m.deleted_at = new Date().toISOString();
    await guardar('movimientos', m, id);
  });
}
export async function respaldoViaje(id: string) {
  const state = await snapshot();
  const viaje = state.viajes.find((v) => v.id === id);
  if (!viaje) throw new Error('Viaje no disponible.');
  // Include purchase and sale provenance for inventory carried across trips.
  const ids = new Set(state.movimientos.filter((m) => m.viaje_id === id).map((m) => m.id));
  const paquetes = state.paquetes.filter(
    (p) =>
      ids.has(p.compra_mov_id ?? '') || ids.has(p.venta_mov_id ?? '') || p.estado !== 'VENDIDO',
  );
  for (const p of paquetes) {
    if (p.compra_mov_id) ids.add(p.compra_mov_id);
    if (p.venta_mov_id) ids.add(p.venta_mov_id);
  }
  const movimientos = state.movimientos.filter((m) => ids.has(m.id));
  return {
    version: 1,
    generado: new Date().toISOString(),
    viaje,
    viajes: state.viajes.filter((v) => movimientos.some((m) => m.viaje_id === v.id) || v.id === id),
    partes: state.partes,
    movimientos,
    paquetes,
    flete_lineas: state.fletes.filter((f) => ids.has(f.movimiento_id)),
  };
}
export type { FleteLinea };

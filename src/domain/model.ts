export const tipos = ['R', 'P', 'J'] as const;
export type TipoHuevo = (typeof tipos)[number];
export const nombres: Record<TipoHuevo, string> = { R: 'Rosado', P: 'Pardo', J: 'Jumbo' };
export interface Metadata {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
}
export interface Viaje extends Metadata {
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: 'ABIERTO' | 'CERRADO';
  nota: string;
}
export interface Parte extends Metadata {
  nombre: string;
  nombre_norm: string;
  roles: ('GRANJA' | 'CLIENTE' | 'FLETE')[];
}
export interface Movimiento extends Metadata {
  viaje_id: string;
  tipo: 'COMPRA' | 'VENTA' | 'FLETE';
  fecha: string;
  parte_id: string;
  precios: Partial<Record<TipoHuevo, number>>;
  precios_completados_at?: string | null;
  tiene_pesos_compra: boolean;
  estado: 'EN_CURSO' | 'TERMINADO';
  legacy_id?: number;
  legacy_resumen?: { peso_c: number; paquetes: number; importe_c: number };
}
export interface Paquete extends Metadata {
  tipo: TipoHuevo;
  peso_c: number;
  granja_id: string | null;
  compra_mov_id: string | null;
  venta_mov_id: string | null;
  estado: 'EN_CAMION' | 'EN_VENTA' | 'VENDIDO';
  origen: 'COMPRA' | 'VENTA_SIN_COMPRA';
  orden_captura: number;
  orden_venta?: number;
}
export interface FleteLinea extends Metadata {
  movimiento_id: string;
  tipo: TipoHuevo;
  cantidad: number;
}
export type Tabla = 'viajes' | 'partes' | 'movimientos' | 'paquetes' | 'flete_lineas';
export type Entidad = Viaje | Parte | Movimiento | Paquete | FleteLinea;
export interface SyncItem {
  seq?: number;
  tabla: Tabla;
  entidad_id: string;
  operacion: 'upsert';
  movimiento_id: string | null;
  intentos: number;
  ultimo_error: string | null;
  siguiente_intento: number;
}
export function metadata(): Metadata {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
    synced_at: null,
  };
}
export function normalizarNombre(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}
export function fechaLima(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function fechaVisible(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00-05:00` : value);
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima' }).format(date);
}
export function diaViaje(fecha: string, hoy = fechaLima()): number {
  return Math.max(
    1,
    Math.floor(
      (Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${fecha.slice(0, 10)}T12:00:00Z`)) / 86400000,
    ) + 1,
  );
}

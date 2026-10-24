import { snapshot } from '../repositories/transporte';

import type { Movimiento, Paquete, TipoHuevo } from '../domain/model';

export async function compartirArchivo(blob: Blob, nombre: string): Promise<void> {
  const file = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Transportes K.S.M' });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }
  descargarArchivo(blob, nombre);
}
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export interface SeccionExportacion {
  movimiento: Movimiento;
  nombre: string;
  paquetes: Paquete[];
  fletes: { tipo: TipoHuevo; cantidad: number }[];
}
export async function seccionesExportacion(id: string, porViaje: boolean) {
  const state = await snapshot();
  const movimientos = state.movimientos.filter((m) => (porViaje ? m.viaje_id === id : m.id === id));
  if (!movimientos.length) throw new Error('No hay movimientos para exportar.');
  return movimientos.map((movimiento): SeccionExportacion => ({
    movimiento,
    nombre: state.partes.find((p) => p.id === movimiento.parte_id)?.nombre ?? 'Sin nombre',
    paquetes: state.paquetes
      .filter((p) =>
        movimiento.tipo === 'COMPRA'
          ? p.compra_mov_id === movimiento.id
          : p.venta_mov_id === movimiento.id,
      )
      .map((p) =>
        movimiento.tipo === 'VENTA' ? { ...p, orden_captura: p.orden_venta ?? p.orden_captura } : p,
      ),
    fletes: state.fletes.filter((f) => f.movimiento_id === movimiento.id),
  }));
}
async function exportar(id: string, formato: 'pdf' | 'xlsx', viaje: boolean) {
  const secciones = await seccionesExportacion(id, viaje);
  const blob = await generarArchivo(secciones, formato);
  const nombre = `${viaje ? 'viaje' : 'movimiento'}-${id}.${formato}`;
  if (formato === 'pdf') descargarArchivo(blob, nombre);
  else await compartirArchivo(blob, nombre);
}
export async function prepararPDF(
  id: string,
  porViaje = false,
): Promise<{ blob: Blob; nombre: string }> {
  const secciones = await seccionesExportacion(id, porViaje);
  const blob = await generarArchivo(secciones, 'pdf');
  return { blob, nombre: `${porViaje ? 'viaje' : 'movimiento'}-${id}.pdf` };
}
export const exportarMovimiento = (id: string, formato: 'pdf' | 'xlsx') =>
  exportar(id, formato, false);
export const exportarViaje = (id: string, formato: 'pdf' | 'xlsx') => exportar(id, formato, true);
function generarArchivo(secciones: SeccionExportacion[], formato: 'pdf' | 'xlsx'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('La exportación tardó demasiado. Intenta exportar un movimiento.'));
    }, 90000);
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      clearTimeout(timeout);
      worker.terminate();
      if (event.data.blob) resolve(event.data.blob);
      else reject(new Error(event.data.error ?? 'No se pudo generar el archivo.'));
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error('No se pudo generar el archivo en este dispositivo.'));
    };
    worker.postMessage({ secciones, formato });
  });
}

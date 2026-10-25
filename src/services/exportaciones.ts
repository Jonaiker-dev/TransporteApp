import { snapshot } from '../repositories/transporte';
import { Dialog } from 'quasar';

import type { Movimiento, Paquete, TipoHuevo } from '../domain/model';

export async function compartirArchivo(
  blob: Blob,
  nombre: string,
  compartirPdf = false,
): Promise<void> {
  const disponible =
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ files: [new File([blob], nombre, { type: blob.type })] });
  const elegido = await elegirNombre(
    nombre,
    compartirPdf && disponible ? 'Compartir' : 'Descargar',
    compartirPdf
      ? disponible
        ? 'Elige el nombre. Después podrás seleccionar WhatsApp u otra aplicación del teléfono.'
        : 'Este navegador no permite compartir este archivo. Puedes descargarlo con el nombre elegido y adjuntarlo en WhatsApp.'
      : undefined,
  );
  if (!elegido) return;
  nombre = elegido;
  const file = new File([blob], nombre, { type: blob.type });
  if (disponible) {
    try {
      await navigator.share({ files: [file], title: 'Transportes K.S.M' });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (compartirPdf)
        throw new Error(
          'No se pudo compartir el PDF. Puedes usar Descargar PDF o Exportar PDF y adjuntarlo en WhatsApp.',
          { cause: err },
        );
    }
  }
  descargarConNombre(blob, nombre);
}
export function nombreArchivo(texto: string, extension: string): string {
  const limpio = texto
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .split('')
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('')
    .replace(/[. ]+$/g, '');
  const base = limpio.toLowerCase().endsWith(`.${extension}`)
    ? limpio.slice(0, -(extension.length + 1)).trim()
    : limpio;
  return base && !/^\.+$/.test(base) ? `${base}.${extension}` : '';
}
function elegirNombre(
  nombre: string,
  accion = 'Descargar',
  mensaje?: string,
): Promise<string | null> {
  const extension = nombre.split('.').at(-1)!;
  return new Promise((resolve) => {
    Dialog.create({
      title: 'Nombre del documento',
      message: mensaje ?? `El archivo se guardará como .${extension}`,
      prompt: {
        model: '',
        type: 'text',
        label: 'Nombre del documento',
        isValid: (value: string) => Boolean(nombreArchivo(value, extension)),
      },
      ok: { label: accion },
      cancel: { label: 'Cancelar', flat: true },
    })
      .onOk((value: string) => resolve(nombreArchivo(value, extension)))
      .onCancel(() => resolve(null));
  });
}
export async function descargarArchivo(blob: Blob, nombre: string): Promise<void> {
  const elegido = await elegirNombre(nombre);
  if (elegido) descargarConNombre(blob, elegido);
}
export function puedeCompartirPDF(blob: Blob): boolean {
  return (
    typeof navigator.share === 'function' &&
    Boolean(
      navigator.canShare?.({ files: [new File([blob], 'documento.pdf', { type: blob.type })] }),
    )
  );
}
export async function entregarPDF(blob: Blob, nombre: string, compartir = false): Promise<void> {
  const elegido = nombreArchivo(nombre, 'pdf');
  if (!elegido) throw new Error('Escribe el nombre del documento.');
  if (!compartir) {
    descargarConNombre(blob, elegido);
    return;
  }
  if (!puedeCompartirPDF(blob))
    throw new Error(
      'Este navegador no permite compartir archivos. Puedes descargar el PDF y adjuntarlo en WhatsApp.',
    );
  try {
    // Keep this call directly in the confirmation click; no generation or dialog awaits here.
    await navigator.share({
      files: [new File([blob], elegido, { type: blob.type })],
      title: 'Transportes K.S.M',
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return;
    throw new Error('No se pudo compartir el PDF. Puedes descargarlo y adjuntarlo en WhatsApp.', {
      cause: err,
    });
  }
}
function descargarConNombre(blob: Blob, nombre: string): void {
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
  if (formato === 'pdf') await descargarArchivo(blob, nombre);
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

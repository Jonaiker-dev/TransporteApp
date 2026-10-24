import { tipos, type Paquete, type TipoHuevo } from './model';

export function parsePeso(text: string): number {
  if (!/^\d{1,6}(\.\d{0,2})?$/.test(text)) throw new Error('Usa un peso con hasta dos decimales.');
  const [integer = '0', decimal = ''] = text.split('.');
  const value = Number(integer) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(value)) throw new Error('Peso fuera de rango.');
  return value;
}
export function formatPeso(value: number): string {
  return `${Math.trunc(value / 100)}.${String(Math.abs(value % 100)).padStart(2, '0')}`;
}
export function normalizarTeclado(text: string, key: string, autoPunto = true): string {
  if (key === 'clear') return '';
  if (key === 'Backspace') return text.endsWith('.') ? text.slice(0, -2) : text.slice(0, -1);
  if (key === '.') return text.includes('.') ? text : `${text || '0'}.`;
  if (!/^\d$/.test(key)) return text;
  const candidate = text + key;
  if (!/^\d{1,6}(\.\d{0,2})?$/.test(candidate)) return text;
  return autoPunto && /^\d{2}$/.test(candidate) ? `${candidate}.` : candidate;
}
export function groupColumns<T extends Pick<Paquete, 'tipo' | 'peso_c' | 'orden_captura'>>(
  items: T[],
  size = 10,
) {
  if (!Number.isInteger(size) || size <= 0) throw new Error('Tamaño de columna inválido.');
  return tipos.map((tipo) => {
    const sorted = items
      .filter((p) => p.tipo === tipo)
      .sort((a, b) => a.orden_captura - b.orden_captura);
    const columns = Array.from({ length: Math.ceil(sorted.length / size) }, (_, index) => {
      const rows = sorted.slice(index * size, (index + 1) * size);
      return { rows, total: rows.reduce((sum, p) => sum + p.peso_c, 0), offset: index * size };
    });
    return {
      tipo,
      columns,
      cantidad: sorted.length,
      total: sorted.reduce((sum, p) => sum + p.peso_c, 0),
    };
  });
}
export function medianaPorTipo(
  items: Pick<Paquete, 'tipo' | 'peso_c'>[],
  tipo: TipoHuevo,
): number | null {
  const values = items
    .filter((p) => p.tipo === tipo)
    .map((p) => p.peso_c)
    .sort((a, b) => a - b);
  if (values.length < 10) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid]! : (values[mid - 1]! + values[mid]!) / 2;
}
export function esOutlier(peso: number, mediana: number | null): boolean {
  return mediana !== null && mediana > 0 && Math.abs(peso - mediana) > mediana * 0.3;
}

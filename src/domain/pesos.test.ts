import { describe, expect, it } from 'vitest';
import {
  parsePeso,
  formatPeso,
  normalizarTeclado,
  groupColumns,
  medianaPorTipo,
  esOutlier,
} from './pesos';

describe('captura exacta en centésimas', () => {
  it.each([
    ['12', 1200],
    ['12.', 1200],
    ['12.4', 1240],
    ['0.5', 50],
    ['100.25', 10025],
  ])('%s → %i', (text, expected) => {
    expect(parsePeso(text)).toBe(expected);
    expect(parsePeso(formatPeso(expected))).toBe(expected);
  });
  it('rechaza precisión extra, comas, negativos y entradas inválidas', () => {
    for (const value of ['', 'NaN', '12.345', '-2', '1,25', '.'])
      expect(() => parsePeso(value)).toThrow();
  });
  it('captura 20 pesos en 80 toques y permite pesos con tres enteros', () => {
    for (let n = 0; n < 20; n++)
      expect([...'2145'].reduce((v, k) => normalizarTeclado(v, k), '')).toBe('21.45');
    expect([...'100.25'].reduce((v, k) => normalizarTeclado(v, k, false), '')).toBe('100.25');
    expect([...'12.4'].reduce((v, k) => normalizarTeclado(v, k), '')).toBe('12.4');
  });
  it('agrupa por tipo, respeta captura y subtotales sin mutar', () => {
    const items = Array.from({ length: 23 }, (_, i) => ({
      tipo: 'R' as const,
      peso_c: 2145,
      orden_captura: 23 - i,
    }));
    const result = groupColumns(items)[0]!;
    expect(result.columns.map((c) => c.rows.length)).toEqual([10, 10, 3]);
    expect(result.total).toBe(49335);
    expect(result.columns[0]!.total).toBe(21450);
    expect(items[0]!.orden_captura).toBe(23);
  });
  it('solo avisa outliers con diez muestras y más del 30%', () => {
    const items = Array.from({ length: 10 }, () => ({ tipo: 'R' as const, peso_c: 2000 }));
    expect(medianaPorTipo(items.slice(1), 'R')).toBeNull();
    expect(esOutlier(2600, medianaPorTipo(items, 'R'))).toBe(false);
    expect(esOutlier(2601, medianaPorTipo(items, 'R'))).toBe(true);
  });
});

import { expect, it } from 'vitest';
import { ganancia, costoPromedio, costoPaquete, valorInventario } from './ganancia';
import { metadata, type Movimiento, type Paquete } from './model';
const compra = (id: string, precio: number): Movimiento => ({
  ...metadata(),
  id,
  viaje_id: 'v',
  tipo: 'COMPRA',
  fecha: '2026-10-23',
  parte_id: 'g',
  precios: { R: precio },
  tiene_pesos_compra: true,
  estado: 'TERMINADO',
});
const paquete = (compra: string | null, estado: Paquete['estado'] = 'VENDIDO'): Paquete => ({
  ...metadata(),
  tipo: 'R',
  peso_c: 2000,
  granja_id: 'g',
  compra_mov_id: compra,
  venta_mov_id: 'venta',
  estado,
  origen: compra ? 'COMPRA' : 'VENTA_SIN_COMPRA',
  orden_captura: 1,
});
it('reconoce costo por lote, excluye faltantes y no pierde por remanente', () => {
  const movimientos = [
    compra('c1', 500),
    compra('c2', 700),
    { ...compra('venta', 600), tipo: 'VENTA' as const },
  ];
  const items = [paquete('c1'), paquete('c2'), paquete(null), paquete('c1', 'EN_CAMION')];
  const result = ganancia(items, movimientos);
  expect(result.ganancia).toBe(0);
  expect(result.excluidos).toBe(1);
  expect(ganancia([items[1]!], movimientos).ganancia).toBe(-2000);
  expect(valorInventario(items, movimientos).costo).toBe(10000);
  expect(
    costoPromedio([paquete('c1', 'EN_CAMION'), paquete('c2', 'EN_CAMION')], movimientos, 'R'),
  ).toBe(600);
  expect(costoPaquete(2145, 555)).toBe(11905);
});

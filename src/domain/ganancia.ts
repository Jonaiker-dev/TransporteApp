import { tipos, type Movimiento, type Paquete, type TipoHuevo } from './model';

// Centésimas de kg × céntimos/kg → céntimos. Redondeo por paquete.
export function costoPaquete(peso: number, precio: number): number {
  return Math.round((peso * precio) / 100);
}
export function ganancia(items: Paquete[], movimientos: Movimiento[], incluirEnVenta = false) {
  const byId = new Map(movimientos.map((m) => [m.id, m]));
  const resultado = tipos.map((tipo) => {
    let ingreso = 0,
      costo = 0,
      excluidos = 0;
    for (const p of items.filter(
      (p) =>
        !p.deleted_at &&
        p.tipo === tipo &&
        (p.estado === 'VENDIDO' || (incluirEnVenta && p.estado === 'EN_VENTA')),
    )) {
      const compra = p.compra_mov_id ? byId.get(p.compra_mov_id)?.precios[tipo] : undefined;
      const venta = p.venta_mov_id ? byId.get(p.venta_mov_id)?.precios[tipo] : undefined;
      if (compra === undefined || venta === undefined) {
        excluidos++;
        continue;
      }
      ingreso += costoPaquete(p.peso_c, venta);
      costo += costoPaquete(p.peso_c, compra);
    }
    return {
      tipo,
      ingreso,
      costo,
      ganancia: ingreso - costo,
      excluidos,
      porcentaje: costo ? ((ingreso - costo) * 100) / costo : null,
    };
  });
  const ingreso = resultado.reduce((s, r) => s + r.ingreso, 0);
  const costo = resultado.reduce((s, r) => s + r.costo, 0);
  return {
    porTipo: resultado,
    ingreso,
    costo,
    ganancia: ingreso - costo,
    excluidos: resultado.reduce((s, r) => s + r.excluidos, 0),
    porcentaje: costo ? ((ingreso - costo) * 100) / costo : null,
  };
}
export function costoPromedio(
  items: Paquete[],
  movimientos: Movimiento[],
  tipo: TipoHuevo,
): number | null {
  const byId = new Map(movimientos.map((m) => [m.id, m]));
  let costo = 0,
    peso = 0;
  for (const p of items.filter(
    (p) => !p.deleted_at && p.tipo === tipo && p.estado === 'EN_CAMION',
  )) {
    const precio = p.compra_mov_id ? byId.get(p.compra_mov_id)?.precios[tipo] : undefined;
    if (precio === undefined) continue;
    costo += p.peso_c * precio;
    peso += p.peso_c;
  }
  return peso ? Math.round(costo / peso) : null;
}
export function valorInventario(
  items: Paquete[],
  movimientos: Movimiento[],
): { costo: number; excluidos: number } {
  const byId = new Map(movimientos.map((m) => [m.id, m]));
  let costo = 0,
    excluidos = 0;
  for (const p of items.filter((p) => !p.deleted_at && p.estado !== 'VENDIDO')) {
    const precio = p.compra_mov_id ? byId.get(p.compra_mov_id)?.precios[p.tipo] : undefined;
    if (precio === undefined) excluidos++;
    else costo += costoPaquete(p.peso_c, precio);
  }
  return { costo, excluidos };
}
export function soles(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}

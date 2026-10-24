import { expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { crearExcel, crearPDF } from './formatos';
import type { SeccionExportacion } from './exportaciones';
import { metadata } from '../domain/model';
const section: SeccionExportacion = {
  movimiento: {
    ...metadata(),
    viaje_id: 'v',
    tipo: 'VENTA',
    fecha: '2026-10-23',
    parte_id: 'c',
    precios: { R: 600 },
    tiene_pesos_compra: true,
    estado: 'TERMINADO',
  },
  nombre: 'Cliente',
  fletes: [],
  paquetes: Array.from({ length: 300 }, (_, i) => ({
    ...metadata(),
    tipo: 'R',
    peso_c: 2145,
    orden_captura: i,
    granja_id: 'g',
    compra_mov_id: 'c',
    venta_mov_id: 's',
    estado: 'VENDIDO',
    origen: 'COMPRA',
  })),
};
function bytes(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsArrayBuffer(blob);
  });
}
it('Excel conserva las columnas de diez, los totales y fórmulas SUM reales para 300 paquetes', async () => {
  const blob = await crearExcel([section]);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await bytes(blob));
  const sheet = book.worksheets[0]!;
  const formulas: ExcelJS.CellFormulaValue[] = [];
  sheet.eachRow((row) =>
    row.eachCell((cell) => {
      if (cell.type === ExcelJS.ValueType.Formula)
        formulas.push(cell.value as ExcelJS.CellFormulaValue);
    }),
  );
  expect(formulas).toHaveLength(31);
  expect(formulas[0]!.formula).toMatch(/^SUM\(A\d+:A\d+\)$/);
  expect(formulas[0]!.result).toBe(214.5);
  expect(formulas.at(-1)!.result).toBe(6435);
  expect(sheet.getCell('B5').value).toBe(38610);
});
it('PDF A4 se genera localmente con 300 paquetes', async () => {
  const blob = await crearPDF([section]);
  const buffer = await bytes(blob);
  expect(new TextDecoder().decode(buffer.slice(0, 5))).toBe('%PDF-');
}, 20000);

import { groupColumns, formatPeso } from '../domain/pesos';
import { nombres, tipos, fechaVisible } from '../domain/model';
import { costoPaquete, soles } from '../domain/ganancia';
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { SeccionExportacion } from './exportaciones';
function importe(section: SeccionExportacion) {
  return (
    section.movimiento.legacy_resumen?.importe_c ??
    section.paquetes.reduce(
      (s, p) => s + costoPaquete(p.peso_c, section.movimiento.precios[p.tipo] ?? 0),
      0,
    )
  );
}
export async function crearExcel(secciones: SeccionExportacion[]) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook();
  workbook.creator = 'Transportes K.S.M';
  for (let index = 0; index < secciones.length; index++) {
    const section = secciones[index]!;
    const m = section.movimiento;
    const sheet = workbook.addWorksheet(`${index + 1}-${m.tipo}`);
    sheet.addRow(['Transportes K.S.M · Chincha → Lima']);
    sheet.addRow([m.tipo, section.nombre, fechaVisible(m.fecha)]);
    sheet.addRow(['Viaje', m.viaje_id, 'Movimiento', m.id]);
    sheet.addRow([
      'Precios S/kg',
      ...tipos.map(
        (t) =>
          `${nombres[t]}: ${m.precios[t] === undefined ? 'sin precio' : (m.precios[t] / 100).toFixed(2)}`,
      ),
    ]);
    sheet.addRow([m.tipo === 'VENTA' ? 'Total a cobrar S/' : 'Total S/', importe(section) / 100]);
    sheet.addRow([
      'Paquetes sin precio',
      section.paquetes.filter((p) => m.precios[p.tipo] === undefined).length,
    ]);
    if (m.legacy_resumen)
      sheet.addRow([
        'Histórico sin pesos individuales',
        m.legacy_resumen.peso_c / 100,
        m.legacy_resumen.paquetes,
      ]);
    const groups = groupColumns(section.paquetes);
    for (const group of groups.filter((g) => g.cantidad)) {
      sheet.addRow([]);
      sheet.addRow([nombres[group.tipo], `${group.cantidad} paq.`]);
      // Each group uses real columns of ten; subtotal cells retain SUM formulas.
      const start = sheet.rowCount + 1;
      for (let row = 0; row < 10; row++)
        sheet.addRow(group.columns.map((c) => (c.rows[row] ? c.rows[row]!.peso_c / 100 : null)));
      const subtotalRow = sheet.addRow(
        group.columns.map((c, col) => {
          const letter = sheet.getColumn(col + 1).letter;
          return { formula: `SUM(${letter}${start}:${letter}${start + 9})`, result: c.total / 100 };
        }),
      );
      const refs = group.columns.map(
        (_, col) => `${sheet.getColumn(col + 1).letter}${subtotalRow.number}`,
      );
      sheet.addRow(['Total kg', { formula: `SUM(${refs.join(',')})`, result: group.total / 100 }]);
    }
    for (const f of section.fletes) sheet.addRow([nombres[f.tipo], f.cantidad]);
    sheet.columns.forEach((col) => {
      col.width = 20;
      col.numFmt = '0.00';
    });
    sheet.getRow(1).font = { bold: true, size: 16 };
    sheet.pageSetup = {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  workbook.calcProperties.fullCalcOnLoad = true;
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
export function definirPDF(secciones: SeccionExportacion[]): TDocumentDefinitions {
  const content: Content[] = [];
  for (const [index, section] of secciones.entries()) {
    const m = section.movimiento;
    content.push({
      text: 'Transportes K.S.M · Chincha → Lima',
      style: 'titulo',
      ...(index ? { pageBreak: 'before' as const } : {}),
    });
    content.push({
      text: `${m.tipo} · ${section.nombre} · ${fechaVisible(m.fecha)}`,
      margin: [0, 8, 0, 4],
    });
    if (m.estado === 'EN_CURSO')
      content.push({
        text: 'BORRADOR · Movimiento en curso',
        color: '#64748b',
        margin: [0, 0, 0, 6],
      });
    content.push({
      text: tipos
        .map(
          (t) =>
            `${nombres[t]}: ${m.precios[t] === undefined ? 'sin precio' : soles(m.precios[t])} /kg`,
        )
        .join(' · '),
      margin: [0, 8, 0, 8],
    });
    content.push({
      text: `${m.tipo === 'VENTA' ? 'Total a cobrar' : 'Total'}: ${soles(importe(section))}`,
      bold: true,
    });
    const missing = section.paquetes.filter((p) => m.precios[p.tipo] === undefined).length;
    if (missing)
      content.push({
        text: `${missing} paquetes sin precio no incluidos en el importe.`,
        fontSize: 9,
      });
    if (m.legacy_resumen)
      content.push({
        text: `Histórico sin pesos individuales: ${formatPeso(m.legacy_resumen.peso_c)} kg · ${m.legacy_resumen.paquetes} paq.`,
        margin: [0, 8, 0, 8],
      });
    for (const group of groupColumns(section.paquetes).filter((g) => g.cantidad)) {
      content.push({
        text: `${nombres[group.tipo]} · ${group.cantidad} paq. · ${formatPeso(group.total)} kg`,
        bold: true,
        margin: [0, 12, 0, 6],
      });
      // At most five columns per A4 block to keep printed weights legible.
      for (let offset = 0; offset < group.columns.length; offset += 5) {
        const columns = group.columns.slice(offset, offset + 5);
        const rows: TableCell[][] = Array.from({ length: 10 }, (_, row) =>
          columns.map((c) => (c.rows[row] ? formatPeso(c.rows[row].peso_c) : '')),
        );
        rows.push(columns.map((c) => ({ text: formatPeso(c.total), bold: true })));
        content.push({
          table: { widths: columns.map(() => '*'), body: rows },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        });
      }
    }
    for (const f of section.fletes)
      content.push({ text: `${nombres[f.tipo]}: ${f.cantidad} paquetes` });
  }
  const definition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [28, 28, 28, 28],
    content,
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    styles: { titulo: { fontSize: 17, bold: true } },
  };
  return definition;
}
export async function crearPDF(secciones: SeccionExportacion[]): Promise<Blob> {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  const definition = definirPDF(secciones);
  return new Promise((resolve) =>
    pdfMake.createPdf(definition, undefined, undefined, fonts).getBlob(resolve),
  );
}

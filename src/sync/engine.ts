import {
  lotePendiente,
  confirmarLote,
  fallarLote,
  vincularPropietario,
} from '../repositories/respaldo';
import type { Entidad, Tabla } from '../domain/model';
export type Enviar = (tabla: Tabla, rows: (Entidad & { owner_id: string })[]) => Promise<void>;
let flight: Promise<number> | null = null;
export function procesarCola(owner: string, enviar: Enviar): Promise<number> {
  if (flight) return flight;
  flight = run(owner, enviar).finally(() => {
    flight = null;
  });
  return flight;
}
async function run(owner: string, enviar: Enviar): Promise<number> {
  await vincularPropietario(owner);
  let enviados = 0;
  while (true) {
    const batch = await lotePendiente(200);
    if (!batch.length) return enviados;
    try {
      for (const tabla of [
        'viajes',
        'partes',
        'movimientos',
        'paquetes',
        'flete_lineas',
      ] as const) {
        const items = batch.filter((i) => i.tabla === tabla);
        if (items.length)
          await enviar(
            tabla,
            items.map((i) => ({ ...i.entidad, owner_id: owner })),
          );
      }
      await confirmarLote(batch);
      enviados += batch.length;
    } catch (err) {
      // Never store a raw remote error that might include row contents or tokens.
      await fallarLote(
        batch,
        'No se confirmó el lote remoto. Se reintentará sin duplicar registros.',
      );
      throw err;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

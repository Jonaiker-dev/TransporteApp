import { crearParte, listarPartes } from '@/repositories/transporte';
export type ClienteTipo = 'granja' | 'vendedor' | 'flete';
export interface ClienteOptionRecord {
  id: string;
  nombre: string;
  tipo: ClienteTipo;
}
const rol = (tipo: ClienteTipo) =>
  tipo === 'granja'
    ? ('GRANJA' as const)
    : tipo === 'flete'
      ? ('FLETE' as const)
      : ('CLIENTE' as const);
export async function listClientes(tipo: ClienteTipo): Promise<ClienteOptionRecord[]> {
  return (await listarPartes(rol(tipo))).map((p) => ({ id: p.id, nombre: p.nombre, tipo }));
}
export async function getOrCreateCliente(
  tipo: ClienteTipo,
  nombre: string,
): Promise<ClienteOptionRecord> {
  const p = await crearParte(nombre, rol(tipo));
  return { id: p.id, nombre: p.nombre, tipo };
}

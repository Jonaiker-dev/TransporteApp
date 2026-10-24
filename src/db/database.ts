import Dexie, { type Table } from 'dexie';
import {
  metadata,
  normalizarNombre,
  type Viaje,
  type Parte,
  type Movimiento,
  type Paquete,
  type FleteLinea,
  type SyncItem,
} from '../domain/model';

export interface OfflineRecord<T = unknown> {
  collection: string;
  id: string;
  data: T;
  updatedAt: number;
  syncStatus: 'pending' | 'synced';
}

export interface PendingMutation<T = unknown> {
  id?: number;
  collection: string;
  recordId: string;
  operation: 'put' | 'delete';
  data?: T;
  createdAt: number;
}

export interface UserRecord {
  id?: number;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol: 'conductor' | 'administrador' | 'cliente' | 'usuario';
  avatar?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface MovimientoRecord {
  id?: number | undefined;
  tipo: 'compra' | 'venta' | 'flete';
  fecha: string;
  entidad: string; // Nombre de Granja o Cliente
  rosadoPrecio?: number | undefined;
  pardoPrecio?: number | undefined;
  jumboPrecio?: number | undefined;
  kilosTotal?: number | undefined;
  paquetesTotal?: number | undefined;
  paquetesRosados?: number | undefined;
  paquetesPardos?: number | undefined;
  paquetesJumbos?: number | undefined;
  montoTotal?: number | undefined;
  tienePesosCompra?: boolean | undefined;
  createdAt: number;
}

export type ClienteTipo = 'granja' | 'vendedor';

export interface ClienteRecord {
  id?: number;
  nombre: string;
  nombreNormalizado: string;
  tipo: ClienteTipo;
  createdAt: number;
}

class TransporteDatabase extends Dexie {
  records!: Table<OfflineRecord, [string, string]>;
  outbox!: Table<PendingMutation, number>;
  users!: Table<UserRecord, number>;
  legacy_movimientos!: Table<MovimientoRecord, number>;
  movimientos!: Table<Movimiento, string>;
  viajes!: Table<Viaje, string>;
  partes!: Table<Parte, string>;
  paquetes!: Table<Paquete, string>;
  flete_lineas!: Table<FleteLinea, string>;
  sync_queue!: Table<SyncItem, number>;
  settings!: Table<{ key: string; value: string }, string>;
  clientes!: Table<ClienteRecord, number>;

  constructor() {
    super('transporteapp');

    this.version(1).stores({
      records: '[collection+id], collection, updatedAt, syncStatus',
      outbox: '++id, [collection+recordId], createdAt',
    });

    this.version(2).stores({
      records: '[collection+id], collection, updatedAt, syncStatus',
      outbox: '++id, [collection+recordId], createdAt',
      users: '++id, &email, rol, createdAt',
    });

    this.version(3).stores({
      records: '[collection+id], collection, updatedAt, syncStatus',
      outbox: '++id, [collection+recordId], createdAt',
      users: '++id, &email, rol, createdAt',
      movimientos: '++id, tipo, fecha, entidad, createdAt',
    });

    this.version(4).stores({
      records: '[collection+id], collection, updatedAt, syncStatus',
      outbox: '++id, [collection+recordId], createdAt',
      users: '++id, &email, rol, createdAt',
      movimientos: '++id, tipo, fecha, entidad, createdAt',
      clientes: '++id, &[tipo+nombreNormalizado], tipo, nombreNormalizado',
    });

    // IndexedDB cannot change a primary key in place. Archive, remove and recreate
    // across versions within the single atomic upgrade transaction. Never delete legacy data.
    this.version(5)
      .stores({ legacy_movimientos: '++id, tipo, fecha' })
      .upgrade(async (tx) => {
        await tx.table('legacy_movimientos').bulkPut(await tx.table('movimientos').toArray());
      });
    this.version(6).stores({ movimientos: null });
    this.version(7)
      .stores({
        movimientos: 'id, viaje_id, tipo, fecha, parte_id, estado, legacy_id',
        viajes: 'id, estado, fecha_inicio',
        partes: 'id, &nombre_norm, *roles',
        paquetes: 'id, [estado+tipo+granja_id], compra_mov_id, venta_mov_id, estado, orden_captura',
        flete_lineas: 'id, movimiento_id',
        sync_queue: '++seq, [tabla+entidad_id], movimiento_id, siguiente_intento',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        const legacy = await tx.table<MovimientoRecord>('legacy_movimientos').toArray();
        const clientes = await tx.table<ClienteRecord>('clientes').toArray();
        const partes = new Map<string, Parte>();
        const save = async (tabla: string, entity: Viaje | Parte | Movimiento | FleteLinea) => {
          await tx.table(tabla).put(entity);
          await tx.table('sync_queue').add({
            tabla,
            entidad_id: entity.id,
            operacion: 'upsert',
            movimiento_id: tabla === 'movimientos' ? entity.id : null,
            intentos: 0,
            ultimo_error: null,
            siguiente_intento: 0,
          });
        };
        const parte = (nombre: string, rol: Parte['roles'][number]) => {
          const norm = normalizarNombre(nombre);
          let p = partes.get(norm);
          if (!p) {
            p = {
              ...metadata(),
              nombre: nombre.trim() || 'Sin nombre (histórico)',
              nombre_norm: norm,
              roles: [],
            };
            partes.set(norm, p);
          }
          if (!p.roles.includes(rol)) p.roles.push(rol);
          return p;
        };
        for (const c of clientes) parte(c.nombre, c.tipo === 'granja' ? 'GRANJA' : 'CLIENTE');
        if (legacy.length) {
          const fechas = legacy
            .map((m) => {
              const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(m.fecha);
              return match
                ? `${match[3]}-${match[2]!.padStart(2, '0')}-${match[1]!.padStart(2, '0')}`
                : m.fecha.slice(0, 10);
            })
            .sort();
          const viaje: Viaje = {
            ...metadata(),
            fecha_inicio: fechas[0]!,
            fecha_fin: fechas.at(-1)!,
            estado: 'CERRADO',
            nota: 'Histórico importado. Los totales agregados no contienen pesos individuales y no generan stock ni ganancia.',
          };
          await save('viajes', viaje);
          for (let i = 0; i < legacy.length; i++) {
            const old = legacy[i]!;
            const p = parte(
              old.entidad,
              old.tipo === 'compra' ? 'GRANJA' : old.tipo === 'flete' ? 'FLETE' : 'CLIENTE',
            );
            const precios: Movimiento['precios'] = {};
            for (const [tipo, value] of [
              ['R', old.rosadoPrecio],
              ['P', old.pardoPrecio],
              ['J', old.jumboPrecio],
            ] as const) {
              if (value !== undefined && Number.isFinite(value) && value >= 0)
                precios[tipo] = Math.round(value * 100);
            }
            const m: Movimiento = {
              ...metadata(),
              viaje_id: viaje.id,
              tipo: old.tipo.toUpperCase() as Movimiento['tipo'],
              fecha: fechas[0]!,
              parte_id: p.id,
              precios,
              tiene_pesos_compra: old.tienePesosCompra ?? true,
              estado: 'TERMINADO',
              ...(old.id !== undefined ? { legacy_id: old.id } : {}),
              legacy_resumen: {
                peso_c: Math.round((old.kilosTotal ?? 0) * 100),
                paquetes: old.paquetesTotal ?? 0,
                importe_c: Math.round((old.montoTotal ?? 0) * 100),
              },
            };
            // Preserve each record's date rather than the archive trip's initial date.
            const parts = old.fecha.split('/');
            m.fecha =
              parts.length === 3
                ? `${parts[2]}-${parts[1]!.padStart(2, '0')}-${parts[0]!.padStart(2, '0')}`
                : old.fecha.slice(0, 10);
            await save('movimientos', m);
            if (m.tipo === 'FLETE')
              for (const [tipo, cantidad] of [
                ['R', old.paquetesRosados],
                ['P', old.paquetesPardos],
                ['J', old.paquetesJumbos],
              ] as const) {
                if (cantidad)
                  await save('flete_lineas', {
                    ...metadata(),
                    movimiento_id: m.id,
                    tipo,
                    cantidad,
                  });
              }
          }
        }
        for (const p of partes.values()) await save('partes', p);
      });
  }
}

export const offlineDatabase = new TransporteDatabase();

export async function getOfflineRecord<T>(
  collection: string,
  id: string,
): Promise<OfflineRecord<T> | undefined> {
  return offlineDatabase.records.get([collection, id]) as Promise<OfflineRecord<T> | undefined>;
}

export async function listOfflineRecords<T>(collection: string): Promise<OfflineRecord<T>[]> {
  return offlineDatabase.records.where('collection').equals(collection).toArray() as Promise<
    OfflineRecord<T>[]
  >;
}

export async function saveOfflineRecord<T>(collection: string, id: string, data: T): Promise<void> {
  const updatedAt = Date.now();

  await offlineDatabase.transaction('rw', offlineDatabase.records, offlineDatabase.outbox, () =>
    Promise.all([
      offlineDatabase.records.put({
        collection,
        id,
        data,
        updatedAt,
        syncStatus: 'pending',
      }),
      offlineDatabase.outbox.add({
        collection,
        recordId: id,
        operation: 'put',
        data,
        createdAt: updatedAt,
      }),
    ]),
  );
}

export async function deleteOfflineRecord(collection: string, id: string): Promise<void> {
  const createdAt = Date.now();

  await offlineDatabase.transaction('rw', offlineDatabase.records, offlineDatabase.outbox, () =>
    Promise.all([
      offlineDatabase.records.delete([collection, id]),
      offlineDatabase.outbox.add({
        collection,
        recordId: id,
        operation: 'delete',
        createdAt,
      }),
    ]),
  );
}

export async function listPendingMutations(): Promise<PendingMutation[]> {
  return offlineDatabase.outbox.orderBy('createdAt').toArray();
}

export async function syncPendingMutations(
  sendMutation: (mutation: PendingMutation) => Promise<void>,
): Promise<number> {
  const mutations = await listPendingMutations();
  let synchronized = 0;

  for (const mutation of mutations) {
    if (mutation.id === undefined) {
      throw new Error('A pending mutation is missing its database ID.');
    }

    await sendMutation(mutation);
    await acknowledgePendingMutation(mutation.id);
    synchronized += 1;
  }

  return synchronized;
}

export async function acknowledgePendingMutation(id: number): Promise<void> {
  await offlineDatabase.transaction(
    'rw',
    offlineDatabase.records,
    offlineDatabase.outbox,
    async () => {
      const mutation = await offlineDatabase.outbox.get(id);

      if (!mutation) {
        return;
      }

      await offlineDatabase.outbox.delete(id);

      if (mutation.operation === 'put') {
        const pendingForRecord = await offlineDatabase.outbox
          .where('[collection+recordId]')
          .equals([mutation.collection, mutation.recordId])
          .count();

        if (pendingForRecord === 0) {
          await offlineDatabase.records.update([mutation.collection, mutation.recordId], {
            syncStatus: 'synced',
          });
        }
      }
    },
  );
}

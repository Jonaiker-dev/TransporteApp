import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { observar, type Snapshot } from '../repositories/transporte';
import { costoPaquete, ganancia, valorInventario } from '../domain/ganancia';
import type { Movimiento } from '../domain/model';

const vacio = (): Snapshot => ({
  viajes: [],
  partes: [],
  movimientos: [],
  paquetes: [],
  fletes: [],
  pendientes: 0,
});
const data = shallowRef<Snapshot>(vacio());
const error = ref('');
const ready = ref(false);
let consumers = 0;
let sub: ReturnType<typeof observar> | undefined;
let lecturaVersion = 0;

function iniciarLectura() {
  const version = ++lecturaVersion;
  sub = observar(
    (state) => {
      if (version !== lecturaVersion) return;
      data.value = state;
      ready.value = true;
      error.value = '';
    },
    (err) => {
      if (version !== lecturaVersion) return;
      error.value = err instanceof Error ? err.message : 'No se pudo abrir la base local.';
      ready.value = true;
    },
  );
}
function reintentarLectura() {
  if (!consumers) return;
  sub?.unsubscribe();
  error.value = '';
  iniciarLectura();
}
function alVolver() {
  if (document.visibilityState === 'visible') reintentarLectura();
}
export function useTransporte() {
  consumers++;
  if (!sub || sub.closed || error.value) {
    sub?.unsubscribe();
    iniciarLectura();
  }
  if (consumers === 1) {
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('pageshow', alVolver);
  }
  onScopeDispose(() => {
    if (--consumers === 0) {
      lecturaVersion++;
      sub?.unsubscribe();
      sub = undefined;
      data.value = vacio();
      ready.value = false;
      error.value = '';
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('pageshow', alVolver);
    }
  });
  const abierto = computed(() => data.value.viajes.find((v) => v.estado === 'ABIERTO'));
  const stock = computed(() => data.value.paquetes.filter((p) => p.estado !== 'VENDIDO'));
  const inventario = computed(() => valorInventario(data.value.paquetes, data.value.movimientos));
  function esperarMovimiento(id: string): Promise<void> {
    if (data.value.movimientos.some((m) => m.id === id)) return Promise.resolve();
    if (error.value) return Promise.reject(new Error(error.value));
    // Wait for the existing live query to publish the committed movement. No
    // extra database read, and the destination never sees a stale empty state.
    return new Promise((resolve, reject) => {
      const stop = watch([data, error], () => {
        if (data.value.movimientos.some((m) => m.id === id)) {
          stop();
          resolve();
        } else if (error.value) {
          stop();
          reject(new Error(error.value));
        }
      });
    });
  }
  function paquetesMovimiento(m: Movimiento) {
    return data.value.paquetes
      .filter((p) => (m.tipo === 'COMPRA' ? p.compra_mov_id === m.id : p.venta_mov_id === m.id))
      .map((p) =>
        m.tipo === 'VENTA' ? { ...p, orden_captura: p.orden_venta ?? p.orden_captura } : p,
      );
  }
  function totalMovimiento(m: Movimiento) {
    return paquetesMovimiento(m).reduce(
      (sum, p) =>
        sum + (m.precios[p.tipo] !== undefined ? costoPaquete(p.peso_c, m.precios[p.tipo]!) : 0),
      0,
    );
  }
  function resumenViaje(id: string) {
    const movimientos = data.value.movimientos.filter((m) => m.viaje_id === id);
    const compras = new Set(movimientos.filter((m) => m.tipo === 'COMPRA').map((m) => m.id));
    const ventas = new Set(
      movimientos.filter((m) => m.tipo === 'VENTA' && m.estado === 'TERMINADO').map((m) => m.id),
    );
    const comprado = data.value.paquetes.filter((p) => compras.has(p.compra_mov_id ?? ''));
    const vendido = data.value.paquetes.filter(
      (p) => ventas.has(p.venta_mov_id ?? '') && p.estado === 'VENDIDO',
    );
    return {
      movimientos,
      comprado,
      vendido,
      resultado: ganancia(vendido, data.value.movimientos),
      ingreso: vendido.reduce((sum, p) => {
        const precio = data.value.movimientos.find((m) => m.id === p.venta_mov_id)?.precios[p.tipo];
        return sum + (precio === undefined ? 0 : costoPaquete(p.peso_c, precio));
      }, 0),
    };
  }
  return {
    data,
    error,
    ready,
    reintentarLectura,
    abierto,
    stock,
    inventario,
    esperarMovimiento,
    paquetesMovimiento,
    totalMovimiento,
    resumenViaje,
  };
}

import { computed, onScopeDispose, ref, shallowRef } from 'vue';
import { observar, type Snapshot } from '../repositories/transporte';
import { costoPaquete, ganancia, valorInventario } from '../domain/ganancia';
import type { Movimiento } from '../domain/model';

export function useTransporte() {
  const data = shallowRef<Snapshot>({
    viajes: [],
    partes: [],
    movimientos: [],
    paquetes: [],
    fletes: [],
    pendientes: 0,
  });
  const error = ref('');
  const ready = ref(false);
  const sub = observar(
    (state) => {
      data.value = state;
      ready.value = true;
      error.value = '';
    },
    (err) => {
      error.value = err instanceof Error ? err.message : 'No se pudo abrir la base local.';
      ready.value = true;
    },
  );
  onScopeDispose(() => sub.unsubscribe());
  const abierto = computed(() => data.value.viajes.find((v) => v.estado === 'ABIERTO'));
  const stock = computed(() => data.value.paquetes.filter((p) => p.estado !== 'VENDIDO'));
  const inventario = computed(() => valorInventario(data.value.paquetes, data.value.movimientos));
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
    abierto,
    stock,
    inventario,
    paquetesMovimiento,
    totalMovimiento,
    resumenViaje,
  };
}

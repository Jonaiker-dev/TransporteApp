import { computed } from 'vue';
import { useRoute, useRouter, type LocationQueryValue } from 'vue-router';
import { useTransporte } from '@/composables/useTransporte';
import { normalizarNombre } from '@/domain/model';
import type { Snapshot } from '@/repositories/transporte';
import { proyectarMovimientos, type MovimientoHistorial } from '../api';

export interface FiltrosMovimientos {
  q: string;
  desde: string;
  hasta: string;
  tipo: string;
  estado: string;
}

export function filtrarMovimientos(
  movimientos: MovimientoHistorial[],
  state: Snapshot,
  filtros: FiltrosMovimientos,
) {
  const texto = normalizarNombre(filtros.q);
  const partes = new Set(
    state.partes.filter((p) => normalizarNombre(p.nombre).includes(texto)).map((p) => p.id),
  );
  const relacionados = new Set<string>();
  if (texto) {
    for (const p of state.paquetes) {
      if (!p.granja_id || !partes.has(p.granja_id)) continue;
      if (p.compra_mov_id) relacionados.add(p.compra_mov_id);
      if (p.venta_mov_id) relacionados.add(p.venta_mov_id);
    }
  }
  return movimientos.filter(
    (m) =>
      (!texto ||
        partes.has(m.parteId) ||
        normalizarNombre(m.entidad).includes(texto) ||
        relacionados.has(m.id ?? '')) &&
      (!filtros.tipo || m.tipo === filtros.tipo) &&
      (!filtros.estado || m.estado === filtros.estado) &&
      (!filtros.desde || m.fechaISO >= filtros.desde) &&
      (!filtros.hasta || m.fechaISO <= filtros.hasta),
  );
}

export function useMovimientos() {
  const route = useRoute();
  const router = useRouter();
  const { data, ready, error } = useTransporte();
  const texto = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
    typeof value === 'string' ? value : '';
  const filtros = computed<FiltrosMovimientos>(() => ({
    q: texto(route.query.q),
    desde: texto(route.query.desde),
    hasta: texto(route.query.hasta),
    tipo: texto(route.query.tipo),
    estado: texto(route.query.estado),
  }));
  const todos = computed(() => proyectarMovimientos(data.value));
  const filtrados = computed(() => filtrarMovimientos(todos.value, data.value, filtros.value));
  const limite = computed(() => {
    const valor = Number(texto(route.query.limite));
    return Number.isFinite(valor)
      ? Math.max(40, Math.min(todos.value.length + 40, Math.floor(valor)))
      : 40;
  });
  const visibles = computed(() => filtrados.value.slice(0, limite.value));
  function actualizar(campo: keyof FiltrosMovimientos, valor: string | number | null) {
    const query = { ...route.query };
    if (valor) query[campo] = String(valor);
    else delete query[campo];
    delete query.limite;
    void router.replace({ path: route.path, query });
  }
  function limpiar() {
    void router.replace({ path: route.path });
  }
  function verMas() {
    void router.replace({ query: { ...route.query, limite: String(limite.value + 40) } });
  }
  function abrir(m: { id?: string | undefined; tipo: string }) {
    if (m.id)
      void router.push({ path: `/viaje/${m.tipo}/${m.id}`, query: { volver: route.fullPath } });
  }
  return {
    data,
    ready,
    error,
    filtros,
    todos,
    filtrados,
    visibles,
    actualizar,
    limpiar,
    verMas,
    abrir,
  };
}

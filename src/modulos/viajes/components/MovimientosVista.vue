<template>
  <q-page class="movements-page q-px-md q-py-md">
    <div class="movements-content">
      <AppButton to="/" icon="arrow_back" label="Inicio" variant="ghost" size="md" />
      <header class="movements-heading">
        <div class="movements-eyebrow">TU ACTIVIDAD</div>
        <h1>Movimientos</h1>
        <p>Compras, ventas y fletes de todos tus viajes, en un solo lugar.</p>
      </header>
      <AppButtonRow label="Vistas de movimientos" navigation class="q-mb-md">
        <AppButton
          :to="{ path: '/movimientos', query: route.query }"
          label="Historial"
          icon="history"
          :variant="buscar ? 'secondary' : 'primary'"
          :aria-current="!buscar ? 'page' : undefined"
          size="md"
          block
        />
        <AppButton
          :to="{ path: '/movimientos/buscar', query: route.query }"
          label="Buscar"
          icon="search"
          :variant="buscar ? 'primary' : 'secondary'"
          :aria-current="buscar ? 'page' : undefined"
          size="md"
          block
        />
      </AppButtonRow>
      <AppCard v-if="buscar" class="q-mb-md">
        <h2>Buscar movimientos</h2>
        <p class="movements-hint">
          Escribe un cliente o una granja. También se incluyen ventas de sus paquetes.
        </p>
        <q-select
          :model-value="filtros.q"
          @update:model-value="actualizar('q', $event)"
          @input-value="actualizar('q', $event)"
          @filter="filtrarSugerencias"
          :options="sugerencias"
          use-input
          fill-input
          hide-selected
          hide-dropdown-icon
          behavior="menu"
          :input-debounce="0"
          label="Cliente o granja"
          outlined
          clearable
          class="q-mb-md"
          data-testid="movement-search"
          ><template #prepend><q-icon name="search" aria-hidden="true" /></template>
          <template #no-option>
            <q-item
              ><q-item-section class="text-grey-7"
                >Sin sugerencias. Puedes seguir buscando por texto.</q-item-section
              ></q-item
            >
          </template>
        </q-select>
        <div class="movement-filters">
          <q-input
            :model-value="filtros.desde"
            @update:model-value="actualizar('desde', $event)"
            type="date"
            label="Desde"
            outlined
            stack-label
          />
          <q-input
            :model-value="filtros.hasta"
            @update:model-value="actualizar('hasta', $event)"
            type="date"
            label="Hasta"
            outlined
            stack-label
          />
          <q-select
            :model-value="filtros.tipo"
            @update:model-value="actualizar('tipo', $event)"
            :options="tipos"
            emit-value
            map-options
            label="Movimiento"
            outlined
          />
          <q-select
            :model-value="filtros.estado"
            @update:model-value="actualizar('estado', $event)"
            :options="estados"
            emit-value
            map-options
            label="Estado"
            outlined
          />
        </div>
        <p v-if="rangoInvalido" class="text-negative q-mt-sm" role="alert">
          La fecha Desde debe ser anterior o igual a Hasta.
        </p>
        <AppButton
          v-if="hayFiltros"
          label="Limpiar búsqueda"
          icon="filter_alt_off"
          @click="limpiar"
          variant="ghost"
          size="md"
          class="q-mt-sm"
        />
      </AppCard>
      <div v-else-if="hayFiltros" class="movements-filter-note q-mb-md">
        <span>Historial con los filtros de tu búsqueda.</span>
        <AppButton label="Ver todo" @click="limpiar" variant="ghost" size="md" />
      </div>
      <q-banner v-if="error" class="bg-red-1 text-negative q-mb-md" role="alert">{{
        error
      }}</q-banner>
      <section aria-label="Resultados de movimientos" :aria-busy="!ready">
        <div class="movements-section-heading">
          <h2>{{ buscar ? 'Resultados' : 'Historial de movimientos' }}</h2>
          <span role="status" aria-live="polite"
            >{{ filtrados.length }} {{ filtrados.length === 1 ? 'registro' : 'registros' }}</span
          >
        </div>
        <AppCard v-if="!ready" role="status">Cargando movimientos…</AppCard>
        <AppCard v-else-if="!filtrados.length" class="movements-empty">
          <q-icon
            :name="hayFiltros ? 'search_off' : 'receipt_long'"
            size="32px"
            aria-hidden="true"
          />
          <h2>{{ hayFiltros ? 'Sin coincidencias' : 'Tu historial empieza aquí' }}</h2>
          <p>
            {{
              hayFiltros
                ? 'Prueba con otro nombre o amplía las fechas de búsqueda.'
                : 'Cuando registres una compra, venta o flete, aparecerá aquí.'
            }}
          </p>
          <AppButton
            v-if="hayFiltros"
            label="Limpiar búsqueda"
            @click="limpiar"
            variant="secondary"
            size="md"
          />
          <AppButton v-else to="/viaje" label="Ir al viaje" variant="primary" size="md" />
        </AppCard>
        <template v-else>
          <article v-for="m in visibles" :key="m.id" class="movement-result">
            <div class="movement-trip">Viaje {{ m.fechaViaje }}</div>
            <MovimientoCard :movimiento="m" @open-movement="abrir" />
          </article>
          <AppButton
            v-if="visibles.length < filtrados.length"
            label="Ver más movimientos"
            @click="verMas"
            variant="secondary"
            size="md"
            block
          />
          <p class="movements-hint q-mt-md">
            Mostrando {{ visibles.length }} de {{ filtrados.length }} movimientos.
          </p>
        </template>
      </section>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import MovimientoCard from './MovimientoCard.vue';
import { useMovimientos } from '../composables/useMovimientos';
import { normalizarNombre } from '@/domain/model';
defineProps<{ buscar?: boolean }>();
const route = useRoute();
const { data, ready, error, filtros, filtrados, visibles, actualizar, limpiar, verMas, abrir } =
  useMovimientos();
const textoSugerencias = ref('');
const sugerencias = computed(() => {
  const nombres = new Map<string, string>();
  const consulta = normalizarNombre(textoSugerencias.value);
  for (const parte of data.value.partes) {
    const nombre = parte.nombre.trim();
    const normalizado = normalizarNombre(nombre);
    if (normalizado && normalizado.includes(consulta) && !nombres.has(normalizado)) {
      nombres.set(normalizado, nombre);
    }
  }
  return [...nombres.values()].sort((a, b) => a.localeCompare(b, 'es')).slice(0, 20);
});
function filtrarSugerencias(value: string, update: (callback: () => void) => void) {
  update(() => {
    textoSugerencias.value = value;
  });
}
const hayFiltros = computed(() => Object.values(filtros.value).some(Boolean));
const rangoInvalido = computed(
  () => filtros.value.desde && filtros.value.hasta && filtros.value.desde > filtros.value.hasta,
);
const tipos = [
  { label: 'Todos', value: '' },
  { label: 'Compra', value: 'compra' },
  { label: 'Venta', value: 'venta' },
  { label: 'Flete', value: 'flete' },
];
const estados = [
  { label: 'Todos', value: '' },
  { label: 'En curso', value: 'EN_CURSO' },
  { label: 'Terminado', value: 'TERMINADO' },
];
</script>
<style scoped>
.movements-page {
  background: var(--ksm-surface);
  color: var(--ksm-text);
}
.movements-content {
  max-width: 480px;
  margin: auto;
  padding-bottom: 96px;
}
.movements-heading {
  margin: 16px 0 24px;
}
.movements-eyebrow {
  color: var(--ksm-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.movements-heading h1 {
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
  margin: 4px 0 8px;
}
h2 {
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  margin: 0;
}
p {
  margin: 8px 0 16px;
}
.movements-heading p,
.movements-hint,
.movement-trip,
.movements-section-heading span,
.movements-empty p {
  color: var(--ksm-muted);
  font-size: 14px;
  line-height: 22px;
}
.movement-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 8px;
}
.movements-section-heading,
.movements-filter-note {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.movement-trip {
  margin: 16px 0 4px;
}
.movements-empty {
  text-align: center;
  padding-block: 24px;
}
.movements-empty h2 {
  margin-top: 12px;
}
.movement-result {
  min-width: 0;
}
@media (max-width: 359px) {
  .movement-filters {
    grid-template-columns: 1fr;
  }
}
</style>

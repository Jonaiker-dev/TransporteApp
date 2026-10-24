<template>
  <AppCard
    class="movimiento-card q-mb-sm"
    role="link"
    :tabindex="movimiento.id ? 0 : -1"
    :aria-label="`Abrir ${movimiento.tipo} de ${movimiento.entidad}`"
    @click="abrir"
    @keydown.enter.prevent="abrir"
    @keydown.space.prevent="abrir"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="row items-center no-wrap">
        <!-- Badge de tipo -->
        <span
          class="tipo-pill q-px-sm q-py-xs text-caption text-weight-bold q-mr-sm"
          :class="{
            'bg-blue-1 text-primary': movimiento.tipo === 'compra',
            'bg-green-1 text-positive': movimiento.tipo === 'venta',
            'bg-orange-1 text-orange-9': movimiento.tipo === 'flete',
          }"
        >
          <q-icon
            :name="
              movimiento.tipo === 'compra'
                ? 'add_shopping_cart'
                : movimiento.tipo === 'venta'
                  ? 'point_of_sale'
                  : 'local_shipping'
            "
            size="14px"
            class="q-mr-xs"
          />
          {{
            movimiento.tipo === 'compra'
              ? 'Compra'
              : movimiento.tipo === 'venta'
                ? 'Venta'
                : 'Flete'
          }}
        </span>

        <!-- Nombre de la entidad -->
        <span class="entidad-name text-weight-bold text-grey-9 ellipsis">
          {{ movimiento.entidad }}
        </span>
      </div>

      <q-icon name="chevron_right" size="20px" aria-hidden="true" />
    </div>

    <!-- Precios de compra o venta -->
    <div
      v-if="movimiento.tipo !== 'flete'"
      class="precios-row row q-gutter-x-md text-caption text-grey-7 q-my-xs"
    >
      <div>
        <span>Rosado: </span>
        <strong class="text-grey-9">S/ {{ movimiento.rosadoPrecio?.toFixed(2) ?? '—' }}</strong>
      </div>
      <div>
        <span>Pardo: </span>
        <strong class="text-grey-9">S/ {{ movimiento.pardoPrecio?.toFixed(2) ?? '—' }}</strong>
      </div>
      <div>
        <span>Jumbo: </span>
        <strong class="text-grey-9">S/ {{ movimiento.jumboPrecio?.toFixed(2) ?? '—' }}</strong>
      </div>
    </div>

    <div v-else class="text-caption text-grey-7 q-my-xs">
      Paquetes: Rosados {{ movimiento.paquetesRosados ?? 0 }} · Pardos
      {{ movimiento.paquetesPardos ?? 0 }} · Jumbos {{ movimiento.paquetesJumbos ?? 0 }}
    </div>

    <q-badge
      :color="movimiento.estado === 'TERMINADO' ? 'grey-7' : 'primary'"
      :label="movimiento.estado === 'TERMINADO' ? 'Terminado' : 'En curso'"
    />
    <div
      v-if="movimiento.tipo === 'venta' && !movimiento.tienePesosCompra"
      class="text-caption q-mt-xs"
    >
      Sin pesos de compra · costo desconocido
    </div>
    <!-- Fecha y subtexto -->
    <div
      v-if="movimiento.tipo === 'venta'"
      class="text-caption q-mt-sm"
      :class="(movimiento.gananciaC ?? 0) < 0 ? 'text-negative' : 'text-positive'"
    >
      Ganancia: {{ (movimiento.gananciaC ?? 0) >= 0 ? '+' : '−' }}S/
      {{ (Math.abs(movimiento.gananciaC ?? 0) / 100).toFixed(2)
      }}<span v-if="movimiento.excluidos">
        · {{ movimiento.excluidos }} paq. sin costo o precio</span
      >
    </div>
    <div class="row items-center justify-between text-caption text-grey-6 q-mt-xs">
      <span>Fecha: {{ movimiento.fecha }}</span>
      <span
        v-if="movimiento.tipo !== 'flete' && movimiento.kilosTotal > 0"
        class="text-weight-medium text-grey-8"
      >
        {{ movimiento.kilosTotal.toLocaleString() }} kg
      </span>
      <span v-else-if="movimiento.tipo !== 'flete'" class="text-grey-5 italic">
        Registrado en ruta
      </span>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue';
import type { Movimiento } from '../types';

const props = defineProps<{
  movimiento: Movimiento;
}>();

const emit = defineEmits<{
  (e: 'open-movement', movimiento: Movimiento): void;
}>();
function abrir() {
  if (props.movimiento.id) emit('open-movement', props.movimiento);
}
</script>

<style scoped>
.movimiento-card {
  cursor: pointer;
}
.movimiento-card:hover,
.movimiento-card:active {
  border-color: var(--ksm-primary);
}
.movimiento-card:focus-visible {
  outline: 3px solid var(--ksm-primary);
  outline-offset: 3px;
}

.tipo-pill {
  border-radius: 9999px;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.entidad-name {
  font-size: 0.95rem;
}

.italic {
  font-style: italic;
}
</style>

<template>
  <section aria-label="Pesos en columnas de diez">
    <div
      v-for="grupo in grupos.filter((g) => g.cantidad)"
      :key="grupo.tipo"
      class="weight-group"
      :class="`weight-type-${grupo.tipo}`"
    >
      <div class="weight-group-heading">
        <strong>{{ grupo.tipo }} · {{ nombres[grupo.tipo] }}</strong
        ><span>{{ grupo.cantidad }} paq. · {{ formatPeso(grupo.total) }} kg</span>
      </div>
      <div class="columnas">
        <AppCard
          v-for="col in todas ? grupo.columns : grupo.columns.slice(-2)"
          :key="col.offset"
          class="peso-columna"
          padding="none"
        >
          <div
            v-for="(p, i) in col.rows"
            :key="p.id"
            class="peso-celda"
            :class="{ ultimo: p.id === ultimoId }"
          >
            <small>{{ col.offset + i + 1 }}</small> {{ formatPeso(p.peso_c) }}
          </div>
          <strong class="subtotal">{{ formatPeso(col.total) }}</strong>
        </AppCard>
      </div>
    </div>
    <AppButton
      v-if="grupos.some((g) => g.columns.length > 2) && !completo"
      :label="todas ? 'Ver últimas columnas' : 'Ver todas'"
      @click="todas = !todas"
      variant="ghost"
      size="md"
    />
    <div v-if="!paquetes.length" class="text-grey-7 q-pa-md text-center">
      Todavía no hay pesos registrados.
    </div>
  </section>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref } from 'vue';
import { nombres, type Paquete } from '../domain/model';
import { groupColumns, formatPeso } from '../domain/pesos';
const props = defineProps<{ paquetes: Paquete[]; completo?: boolean; ultimoId?: string }>();
const expanded = ref(false);
const todas = computed({
  get: () => props.completo || expanded.value,
  set: (value) => {
    expanded.value = value;
  },
});
const grupos = computed(() => groupColumns(props.paquetes));
</script>
<style scoped>
.columnas {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}
.weight-group {
  margin-bottom: 16px;
}
.weight-group-heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 4px 8px;
  margin-bottom: 8px;
}
.weight-group-heading strong {
  font-size: 16px;
  color: var(--egg-color);
}
.weight-group-heading span {
  font-size: 14px;
  color: var(--ksm-muted);
  font-variant-numeric: tabular-nums;
}
.weight-type-R {
  --egg-color: var(--egg-r);
  --egg-bg: var(--egg-r-bg);
}
.weight-type-P {
  --egg-color: var(--egg-p);
  --egg-bg: var(--egg-p-bg);
}
.weight-type-J {
  --egg-color: var(--egg-j);
  --egg-bg: var(--egg-j-bg);
}
.peso-columna {
  min-width: var(--ksm-column-width);
  flex: 0 0 var(--ksm-column-width);
  overflow: hidden;
  font-variant-numeric: tabular-nums lining-nums;
}
.peso-celda {
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 16px;
  line-height: 24px;
  border-bottom: 1px solid var(--ksm-border);
}
.peso-celda small {
  color: var(--ksm-muted);
  font-size: 12px;
}
.subtotal {
  display: block;
  border-top: 2px solid var(--ksm-border);
  padding: 8px;
  font-size: 16px;
  background: var(--ksm-soft);
  text-align: right;
}
.ultimo {
  background: var(--egg-bg);
  color: var(--egg-color);
  box-shadow: inset 4px 0 currentColor;
  font-weight: 700;
}
</style>

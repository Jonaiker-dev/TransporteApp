<template>
  <section class="movement-prices" :class="{ compact }" aria-label="Precios del movimiento">
    <div class="prices-overview">
      <div v-for="t in tipos" :key="t">
        <span>{{ nombres[t] }}</span
        ><strong
          >{{ movimiento.precios[t] === undefined ? 'Sin precio' : soles(movimiento.precios[t]!)
          }}<small v-if="movimiento.precios[t] !== undefined"> /kg</small></strong
        >
      </div>
    </div>
    <AppButton v-if="puedeEditar" type="button" @click="abrir" variant="secondary" size="md" block>
      <q-icon name="edit_note" size="18px" /> Editar precios
      <q-icon name="chevron_right" size="18px" />
    </AppButton>
    <div v-else class="prices-locked">
      <q-icon name="lock_outline" size="13px" /> Viaje cerrado · precios bloqueados
    </div>
    <q-dialog v-model="dialogo" :persistent="busy">
      <AppCard class="price-dialog">
        <div class="row items-start justify-between">
          <div>
            <div class="price-eyebrow">{{ movimiento.tipo === 'COMPRA' ? 'COMPRA' : 'VENTA' }}</div>
            <h2>Editar precios</h2>
          </div>
          <AppButton
            icon="close"
            aria-label="Cerrar precios"
            :disabled="busy"
            v-close-popup
            variant="ghost"
            size="md"
            icon-only
          />
        </div>
        <p class="price-help">
          Puedes cambiar los precios las veces que necesites mientras el viaje esté abierto, incluso
          si el movimiento está terminado.
        </p>
        <form @submit.prevent="guardarPrecios">
          <div class="price-fields">
            <label v-for="t in tipos" :key="t"
              ><span>{{ nombres[t] }} <small>S/ por kg</small></span
              ><input
                v-model="valores[t]"
                :aria-label="`Precio ${nombres[t]}`"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                :required="tiposUsados.includes(t)"
                :disabled="busy"
              />
            </label>
          </div>
          <p class="price-confirmation">Los totales y la ganancia se actualizarán al guardar.</p>
          <p v-if="error" role="alert" class="text-negative">{{ error }}</p>
          <AppButton
            type="submit"
            label="Guardar precios"
            :loading="busy"
            variant="primary"
            size="md"
            block
          />
        </form>
      </AppCard>
    </q-dialog>
  </section>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, reactive, ref } from 'vue';
import { tipos, nombres, type Movimiento, type TipoHuevo } from '../domain/model';
import { soles } from '../domain/ganancia';
import { parsePeso } from '../domain/pesos';
import { completarPrecios } from '../repositories/transporte';
const props = defineProps<{
  movimiento: Movimiento;
  tiposUsados: TipoHuevo[];
  compact?: boolean;
  viajeAbierto: boolean;
}>();
const dialogo = ref(false);
const busy = ref(false);
const error = ref('');
const valores = reactive<Record<TipoHuevo, string>>({ R: '', P: '', J: '' });
const puedeEditar = computed(() => props.viajeAbierto);
function abrir() {
  for (const t of tipos)
    valores[t] =
      props.movimiento.precios[t] === undefined
        ? ''
        : (props.movimiento.precios[t] / 100).toFixed(2);
  error.value = '';
  dialogo.value = true;
}
async function guardarPrecios() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const precios: Movimiento['precios'] = {};
    for (const t of tipos)
      if (String(valores[t]).trim()) precios[t] = parsePeso(String(valores[t]));
    await completarPrecios(props.movimiento.id, precios);
    dialogo.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudieron guardar los precios.';
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.movement-prices {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--ksm-border, #e2e8f0);
}
.movement-prices.compact {
  margin-top: 5px;
  padding-top: 0;
  border-top: 0;
}
.compact .prices-overview {
  display: none;
}
.compact .prices-locked {
  margin-top: 5px;
}
.prices-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
  gap: 8px;
}
.prices-overview span {
  display: block;
  color: var(--ksm-muted, #64748b);
  font-size: 14px;
  margin-bottom: 3px;
}
.prices-overview strong {
  font-size: 14px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.prices-overview small {
  font-size: 14px;
  font-weight: 400;
  color: var(--ksm-muted, #64748b);
}
.prices-locked {
  margin-top: 10px;
  font-size: 14px;
  color: var(--ksm-muted, #64748b);
  display: flex;
  gap: 4px;
  align-items: center;
}
.price-dialog {
  width: calc(100vw - 32px);
  max-width: 440px;
}
.price-dialog h2 {
  margin: 3px 0 12px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}
.price-eyebrow {
  color: var(--ksm-primary);
  font-size: 14px;
  font-weight: 750;
  letter-spacing: 0.1em;
}
.price-help,
.price-confirmation {
  color: var(--ksm-muted, #64748b);
  font-size: 14px;
  line-height: 1.6;
}
.price-confirmation {
  padding: 12px;
  background: var(--ksm-soft);
  border-radius: var(--ksm-radius-control);
  margin: 18px 0;
}
.price-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
  gap: 10px;
}
.price-fields label > span {
  display: block;
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 8px;
}
.price-fields small {
  display: block;
  color: var(--ksm-muted, #64748b);
  font-size: 14px;
  font-weight: 400;
}
.price-fields input {
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 8px;
  border: 1px solid var(--ksm-border, #cbd5e1);
  border-radius: var(--ksm-radius-control);
  background: var(--ksm-soft);
  color: inherit;
  font: inherit;
  font-size: 16px;
}
.existing-price {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  gap: 4px;
}
</style>

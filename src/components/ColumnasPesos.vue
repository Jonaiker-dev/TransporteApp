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
          :class="{ 'columna-editando': col.rows.some((p) => p.id === editandoId) }"
          padding="none"
        >
          <div
            v-for="(p, i) in col.rows"
            :key="p.id"
            class="peso-celda"
            :class="{ ultimo: p.id === ultimoId, 'celda-editando': p.id === editandoId }"
          >
            <form
              v-if="p.id === editandoId && editable"
              class="edicion-peso"
              @submit.prevent="guardarPeso(p)"
              @keydown.esc.prevent.stop="cancelar"
            >
              <label
                >Peso (kg)
                <input
                  :ref="enfocar"
                  v-model="valor"
                  aria-label="Peso corregido"
                  type="text"
                  inputmode="decimal"
                  :disabled="guardando"
                  @keydown.enter.stop
                />
              </label>
              <label
                >Tipo
                <select v-model="tipoEditado" aria-label="Tipo corregido" :disabled="guardando">
                  <option v-for="t in tipos" :key="t" :value="t">{{ nombres[t] }}</option>
                </select>
              </label>
              <div class="acciones-peso">
                <AppButton
                  type="submit"
                  icon="check"
                  aria-label="Guardar peso"
                  :loading="guardando"
                  variant="primary"
                  size="md"
                  icon-only
                />
                <AppButton
                  icon="close"
                  aria-label="Cancelar cambio de peso"
                  :disabled="guardando"
                  variant="ghost"
                  size="md"
                  icon-only
                  @click="cancelar"
                />
              </div>
            </form>
            <AppButton
              v-else-if="editable"
              :disabled="busy || guardando || Boolean(editandoId)"
              :aria-label="`Editar ${formatPeso(p.peso_c)} kg, ${nombres[p.tipo]}, registro ${col.offset + i + 1}`"
              variant="ghost"
              size="md"
              block
              @click="editar(p)"
            >
              <small>{{ col.offset + i + 1 }}</small> {{ formatPeso(p.peso_c) }}
            </AppButton>
            <template v-else
              ><small>{{ col.offset + i + 1 }}</small> {{ formatPeso(p.peso_c) }}</template
            >
            <p v-if="errorId === p.id && error" class="peso-error" role="alert">{{ error }}</p>
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
import { computed, ref, watch, type ComponentPublicInstance } from 'vue';
import { nombres, tipos, type Paquete, type TipoHuevo } from '../domain/model';
import { groupColumns, formatPeso, parsePeso } from '../domain/pesos';
const props = defineProps<{
  paquetes: Paquete[];
  completo?: boolean;
  ultimoId?: string;
  editable?: boolean;
  busy?: boolean;
  guardar?: (paquete: Paquete, tipo: TipoHuevo, peso: number) => Promise<void>;
  motivoBloqueo?: (paquete: Paquete) => string;
}>();
const editandoId = ref('');
const valor = ref('');
const tipoEditado = ref<TipoHuevo>('R');
const guardando = ref(false);
const error = ref('');
const errorId = ref('');
let inputEnfocado: HTMLInputElement | null = null;
function enfocar(element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLInputElement && inputEnfocado !== element) {
    inputEnfocado = element;
    element.focus();
    element.select();
  }
  if (element === null) inputEnfocado = null;
}
function editar(p: Paquete) {
  error.value = props.motivoBloqueo?.(p) ?? '';
  errorId.value = p.id;
  if (error.value) return;
  editandoId.value = p.id;
  valor.value = formatPeso(p.peso_c);
  tipoEditado.value = p.tipo;
}
function cancelar() {
  if (guardando.value) return;
  editandoId.value = '';
  error.value = '';
  errorId.value = '';
}
watch(
  () => props.editable,
  (editable) => {
    if (!editable) cancelar();
  },
);
async function guardarPeso(p: Paquete) {
  if (guardando.value || props.busy || !props.guardar) return;
  error.value = '';
  errorId.value = p.id;
  try {
    const peso = parsePeso(valor.value.trim().replace(',', '.'));
    if (peso <= 0) throw new Error('El peso debe ser mayor que cero.');
    guardando.value = true;
    await props.guardar(p, tipoEditado.value, peso);
    editandoId.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar el peso.';
  } finally {
    guardando.value = false;
  }
}
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
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-size: 16px;
  line-height: 24px;
  border-bottom: 1px solid var(--ksm-border);
}
.columna-editando {
  flex-basis: 184px;
  min-width: 184px;
}
.edicion-peso {
  width: 100%;
  display: grid;
  gap: 8px;
}
.edicion-peso label {
  font-size: 14px;
  display: grid;
  gap: 4px;
}
.edicion-peso input,
.edicion-peso select {
  width: 100%;
  min-width: 0;
  min-height: 48px;
  border: 1px solid var(--ksm-border);
  border-radius: var(--ksm-radius-control);
  background: var(--ksm-card);
  color: var(--ksm-text);
  padding: 4px 8px;
  font: inherit;
}
.edicion-peso input:focus-visible,
.edicion-peso select:focus-visible {
  outline: 2px solid var(--ksm-primary);
  outline-offset: 1px;
}
.acciones-peso {
  display: flex;
  gap: 8px;
}
.peso-error {
  flex-basis: 100%;
  font-size: 14px;
  line-height: 20px;
  color: var(--ksm-negative);
  overflow-wrap: anywhere;
  margin: 0;
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

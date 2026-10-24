<template>
  <AppCard aria-label="Teclado de pesos" class="teclado" tag="section" padding="none">
    <slot name="tipos" />
    <div class="display-row">
      <div class="peso-display" role="status" aria-live="polite">
        <span>{{ texto || '0' }}</span
        ><span class="missing-decimals">{{ relleno }}</span>
      </div>
      <div class="display-unit">
        kg <span v-if="etiqueta">· {{ etiqueta }}</span>
      </div>
    </div>
    <div class="capture-feedback">
      <div class="last-weight" aria-live="polite">
        {{
          ultimo ||
          (marcar
            ? 'Escribe la etiqueta para marcar un paquete.'
            : 'Listo para anotar el primer peso.')
        }}
      </div>
      <div class="mensaje" :class="{ 'has-error': error }" role="status">
        {{ error || mensaje }}
      </div>
    </div>
    <div class="teclas">
      <button
        v-for="key in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']"
        :key="key"
        type="button"
        :aria-label="key === '⌫' ? 'Borrar dígito' : key"
        :disabled="busy"
        @click="pulsar(key === '⌫' ? 'Backspace' : key)"
      >
        {{ key }}
      </button>
      <button
        class="clear-key"
        type="button"
        aria-label="Limpiar"
        :disabled="busy"
        @click="pulsar('clear')"
      >
        C</button
      ><button class="add-key" type="button" :disabled="busy || !texto" @click="enviar">
        <q-spinner v-if="busy" size="22px" /><span v-else>{{ marcar ? 'Marcar' : 'Agregar' }}</span>
      </button>
    </div>
    <AppButton
      type="button"
      :disabled="busy"
      @click="$emit('undo')"
      variant="ghost"
      size="md"
      block
    >
      <q-icon name="undo" size="17px" /> Deshacer último
    </AppButton>
    <details class="keyboard-settings">
      <summary>Ajustes del teclado <span>4 toques por peso</span></summary>
      <label
        ><input v-model="autoAgregar" type="checkbox" /> {{ marcar ? 'Marcar' : 'Agregar' }} al
        completar dos decimales</label
      ><label
        ><input v-model="autoPunto" type="checkbox" /> Punto automático después de dos
        enteros</label
      >
      <p>Para escribir 100.25 kg, desactiva el punto automático.</p>
    </details>
  </AppCard>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { normalizarTeclado, parsePeso } from '../domain/pesos';
const props = defineProps<{
  marcar?: boolean;
  busy?: boolean;
  error?: string;
  mensaje?: string;
  ultimo?: string;
  etiqueta?: string;
}>();
const emit = defineEmits<{ submit: [peso: number]; undo: []; input: [texto: string] }>();
const texto = ref('');
const autoPunto = ref(true);
const autoAgregar = ref(true);
const relleno = computed(() =>
  !texto.value.includes('.') ? '.00' : '0'.repeat(2 - (texto.value.split('.')[1]?.length ?? 0)),
);
function enviar() {
  if (!texto.value || props.busy) return;
  const peso = parsePeso(texto.value);
  emit('submit', peso);
  texto.value = '';
  emit('input', '');
}
function pulsar(key: string) {
  if (props.busy) return;
  texto.value = normalizarTeclado(texto.value, key, autoPunto.value);
  emit('input', texto.value);
  if (autoAgregar.value && /^\d+\.\d{2}$/.test(texto.value)) enviar();
}
function teclado(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (
    document.querySelector('.q-dialog') ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    target.closest('input,textarea,[contenteditable="true"]')
  )
    return;
  if (/^\d$/.test(event.key) || ['.', 'Backspace', 'Delete', 'Enter'].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'Enter') enviar();
    else pulsar(event.key === 'Delete' ? 'clear' : event.key);
  }
}
onMounted(() => window.addEventListener('keydown', teclado));
onBeforeUnmount(() => window.removeEventListener('keydown', teclado));
</script>
<style scoped>
.display-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0;
}
.peso-display {
  font-size: var(--ksm-font-display);
  font-weight: 700;
  line-height: 56px;
  font-variant-numeric: tabular-nums lining-nums;
}
.missing-decimals {
  color: var(--ksm-muted);
}
.display-unit {
  color: var(--ksm-muted);
  font-size: 14px;
  white-space: nowrap;
}
.capture-feedback {
  min-height: 80px;
  margin: 4px 0 8px;
}
.last-weight,
.mensaje {
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
.last-weight {
  color: var(--ksm-muted);
  font-weight: 600;
}
.mensaje {
  color: var(--ksm-positive);
}
.mensaje.has-error {
  color: var(--ksm-negative);
  font-weight: 700;
}
.teclas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.teclas button {
  height: var(--ksm-key-height);
  min-height: var(--ksm-key-height);
  max-height: var(--ksm-key-height);
  min-width: var(--ksm-touch-min);
  padding: 0 8px;
  border: 1px solid var(--ksm-border);
  border-radius: var(--ksm-radius-control);
  background: var(--ksm-soft);
  color: var(--ksm-text);
  font: inherit;
  font-size: var(--ksm-font-key);
  line-height: 32px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  touch-action: manipulation;
  cursor: pointer;
}
.teclas button:active:not(:disabled) {
  background: var(--ksm-pressed);
}
.teclas .add-key {
  grid-column: span 2;
  background: var(--ksm-primary);
  border-color: var(--ksm-primary);
  color: var(--ksm-on-solid);
  font-size: 16px;
  font-weight: 700;
}
.teclas .add-key:active:not(:disabled) {
  background: var(--ksm-primary);
  outline: 2px solid var(--ksm-text);
}
.teclas button:disabled {
  opacity: 1;
  background: var(--ksm-disabled-bg);
  color: var(--ksm-disabled-text);
  cursor: default;
}
.teclas .clear-key {
  font-size: 16px;
}
.keyboard-settings {
  margin-top: 8px;
  border-top: 1px solid var(--ksm-border);
  color: var(--ksm-muted);
  font-size: 14px;
}
.keyboard-settings summary {
  min-height: var(--ksm-touch-min);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  cursor: pointer;
}
.keyboard-settings summary span {
  font-size: 14px;
}
.keyboard-settings label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--ksm-touch-min);
  font-size: 14px;
}
.keyboard-settings input {
  width: 24px;
  height: 24px;
  accent-color: var(--ksm-primary);
  flex-shrink: 0;
}
.keyboard-settings p {
  margin: 8px 0;
  line-height: 1.5;
}
@media (max-height: 800px) {
  .teclas button {
    height: var(--ksm-touch-min);
    min-height: var(--ksm-touch-min);
    max-height: var(--ksm-touch-min);
  }
}
</style>

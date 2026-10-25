<template>
  <AppButton
    icon="file_download"
    label="Exportar PDF"
    :loading="preparando"
    :disabled="disabled"
    variant="secondary"
    size="md"
    @click="abrir"
  />
  <p v-if="error && !dialogo" class="export-error" role="alert">{{ error }}</p>
  <q-dialog v-model="dialogo" :persistent="busy">
    <AppCard class="export-dialog">
      <h2>Exportar PDF</h2>
      <p>Escribe el nombre y elige descargar o compartir el documento.</p>
      <form @submit.prevent="entregar(false)">
        <label class="export-name"
          >Nombre del documento
          <input
            ref="campo"
            v-model="nombre"
            type="text"
            autocomplete="off"
            placeholder="Escribe un nombre"
            :disabled="busy"
            @keydown.enter.stop
          />
        </label>
        <p class="export-extension">Se guardará con extensión .pdf</p>
        <p v-if="!compartible" class="export-extension">
          Este navegador no permite compartir este archivo. Puedes descargarlo y adjuntarlo en
          WhatsApp.
        </p>
        <p v-if="error" class="export-error" role="alert">{{ error }}</p>
        <AppButtonRow label="Exportar documento">
          <AppButton
            type="submit"
            icon="download"
            label="Descargar"
            :disabled="!nombreValido || busy"
            variant="primary"
            size="md"
          />
          <AppButton
            v-if="compartible"
            icon="share"
            label="Compartir"
            :disabled="!nombreValido || busy"
            variant="secondary"
            size="md"
            @click="entregar(true)"
          />
        </AppButtonRow>
        <AppButton
          label="Cancelar"
          :disabled="busy"
          variant="ghost"
          size="md"
          block
          @click="dialogo = false"
        />
      </form>
    </AppCard>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, shallowRef } from 'vue';
import AppButton from './ui/AppButton.vue';
import AppButtonRow from './ui/AppButtonRow.vue';
import AppCard from './ui/AppCard.vue';
import {
  prepararPDF,
  entregarPDF,
  nombreArchivo,
  puedeCompartirPDF,
} from '../services/exportaciones';
const props = defineProps<{
  id: string;
  porViaje?: boolean;
  archivo?: { blob: Blob; nombre: string } | null;
  disabled?: boolean;
}>();
const preparando = ref(false);
const busy = ref(false);
const dialogo = ref(false);
const nombre = ref('');
const error = ref('');
const archivoActual = shallowRef<Blob | null>(null);
const campo = ref<HTMLInputElement | null>(null);
const nombreValido = computed(() => Boolean(nombreArchivo(nombre.value, 'pdf')));
const compartible = computed(() =>
  archivoActual.value ? puedeCompartirPDF(archivoActual.value) : false,
);
async function abrir() {
  if (preparando.value || busy.value) return;
  preparando.value = true;
  error.value = '';
  nombre.value = '';
  try {
    archivoActual.value = (props.archivo ?? (await prepararPDF(props.id, props.porViaje))).blob;
    dialogo.value = true;
    await nextTick();
    campo.value?.focus();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo preparar el PDF.';
  } finally {
    preparando.value = false;
  }
}
async function entregar(compartir: boolean) {
  if (busy.value || !archivoActual.value || !nombreValido.value) return;
  busy.value = true;
  error.value = '';
  try {
    await entregarPDF(archivoActual.value, nombre.value, compartir);
    dialogo.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo exportar el PDF.';
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.export-dialog {
  width: calc(100vw - 32px);
  max-width: 440px;
}
.export-dialog h2 {
  margin: 0;
  font-size: 22px;
}
.export-name {
  display: grid;
  gap: 8px;
  font-size: 16px;
}
.export-name input {
  min-height: 48px;
  width: 100%;
  min-width: 0;
  border: 1px solid var(--ksm-border);
  border-radius: var(--ksm-radius-control);
  padding: 8px;
  font: inherit;
  background: var(--ksm-card);
  color: var(--ksm-text);
}
.export-name input:focus-visible {
  outline: 2px solid var(--ksm-primary);
}
.export-extension {
  font-size: 14px;
  color: var(--ksm-muted);
}
.export-error {
  grid-column: 1 / -1;
  color: var(--ksm-negative);
  font-size: 14px;
  overflow-wrap: anywhere;
}
</style>

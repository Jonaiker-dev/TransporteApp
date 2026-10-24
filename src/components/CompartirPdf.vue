<template>
  <AppButton
    icon="share"
    label="Compartir PDF"
    :loading="busy"
    :disabled="disabled"
    variant="secondary"
    size="md"
    @click="compartir"
  />
  <p v-if="error" class="share-error" role="alert">{{ error }}</p>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import AppButton from './ui/AppButton.vue';
import { prepararPDF, compartirArchivo } from '../services/exportaciones';

const props = defineProps<{
  id: string;
  porViaje?: boolean;
  archivo?: { blob: Blob; nombre: string } | null;
  disabled?: boolean;
}>();
const busy = ref(false);
const error = ref('');
async function compartir() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    // Generate before asking for the name: the final click retains user activation.
    const archivo = props.archivo ?? (await prepararPDF(props.id, props.porViaje));
    await compartirArchivo(archivo.blob, archivo.nombre, true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo compartir el PDF.';
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.share-error {
  grid-column: 1 / -1;
  color: var(--ksm-negative);
  font-size: 14px;
  line-height: 20px;
  overflow-wrap: anywhere;
}
</style>

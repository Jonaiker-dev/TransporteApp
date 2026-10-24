<template>
  <AppButtonRow class="movement-toggle-container q-mb-md" label="Acciones">
    <!-- Botón: Venta en Lima -->
    <AppButton
      type="button"
      :class="{ 'is-active': activeType === 'venta' }"
      :aria-pressed="activeType === 'venta'"
      @click="navigate('venta')"
      variant="secondary"
      size="md"
    >
      <span>Venta</span>
    </AppButton>

    <!-- Botón: Compra en granja -->
    <AppButton
      type="button"
      :class="{ 'is-active': activeType === 'compra' }"
      :aria-pressed="activeType === 'compra'"
      @click="navigate('compra')"
      variant="secondary"
      size="md"
    >
      <span>Compra</span>
    </AppButton>

    <AppButton
      type="button"
      :class="{ 'is-active': activeType === 'flete' }"
      :aria-pressed="activeType === 'flete'"
      @click="navigate('flete')"
      variant="secondary"
      size="md"
    >
      <span>Flete</span>
    </AppButton>
  </AppButtonRow>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  activeType: 'compra' | 'venta' | 'flete';
}>();

const router = useRouter();

function navigate(type: 'compra' | 'venta' | 'flete') {
  if (type !== props.activeType) {
    if (type === 'compra') {
      void router.push('/viaje/compra');
    } else if (type === 'venta') {
      void router.push('/viaje/venta');
    } else {
      void router.push('/viaje/flete');
    }
  }
}
</script>

<style scoped></style>

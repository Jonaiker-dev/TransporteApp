<template>
  <q-page class="flete-page q-px-md q-py-md flex justify-center">
    <div class="content-wrapper full-width">
      <ViajeHeaderNav back-to="/viaje" back-text="Cancelar" />

      <h1 class="page-title text-h5 text-weight-bold text-grey-10 q-my-sm">Registrar flete</h1>

      <MovimientoTypeToggle active-type="flete" />

      <AppCard class="form-card">
        <div class="input-block q-mb-md">
          <ClienteSelect v-model="form.granja" tipo="flete" label="Cliente del flete" />
        </div>

        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">Cantidad de paquetes</div>
        <div class="row q-col-gutter-sm">
          <div class="col-4">
            <q-input
              v-model.number="form.paquetesRosados"
              label="Rosados"
              type="number"
              min="0"
              step="1"
              outlined
              dense
            />
          </div>
          <div class="col-4">
            <q-input
              v-model.number="form.paquetesPardos"
              label="Pardos"
              type="number"
              min="0"
              step="1"
              outlined
              dense
            />
          </div>
          <div class="col-4">
            <q-input
              v-model.number="form.paquetesJumbos"
              label="Jumbos"
              type="number"
              min="0"
              step="1"
              outlined
              dense
            />
          </div>
        </div>
      </AppCard>

      <AppButtonRow
        class="bottom-submit-container"
        label="Acciones"
        fixed
        size="lg"
        above-navigation
      >
        <AppButton
          type="button"
          :disabled="!canSubmit || loading"
          @click="handleSubmit"
          variant="primary"
          size="lg"
          block
          :loading="loading"
          label="Registrar flete"
        ></AppButton>
      </AppButtonRow>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, reactive } from 'vue';
import ViajeHeaderNav from '../components/ViajeHeaderNav.vue';
import ClienteSelect from '../components/ClienteSelect.vue';
import MovimientoTypeToggle from '../components/MovimientoTypeToggle.vue';
import { useViaje } from '../composables/useViaje';
import type { FleteFormData } from '../types';

const { loading, registrarFlete } = useViaje();

const form = reactive<FleteFormData>({
  granja: '',
  paquetesRosados: 0,
  paquetesPardos: 0,
  paquetesJumbos: 0,
});

const canSubmit = computed(() => form.granja.trim().length > 0);

async function handleSubmit() {
  await registrarFlete(form);
}
</script>

<style scoped>
.flete-page {
  width: 100%;
}

.content-wrapper {
  max-width: 480px;
  padding-bottom: 95px;
}

.page-title {
  font-size: 1.35rem;
  letter-spacing: -0.01em;
}

.field-label {
  font-size: 0.86rem;
}

@media (min-width: 1024px) {
}
</style>

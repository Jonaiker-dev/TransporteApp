<template>
  <q-page class="compra-page q-px-md q-py-md flex justify-center">
    <div class="content-wrapper full-width">
      <!-- Encabezado superior con cancelar -->
      <ViajeHeaderNav back-to="/viaje" back-text="Cancelar" />

      <!-- Título: Nuevo movimiento -->
      <h1 class="page-title text-h5 text-weight-bold text-grey-10 q-my-sm">Nuevo movimiento</h1>

      <!-- Selector de tipo: Venta en Lima | Compra en granja -->
      <MovimientoTypeToggle active-type="compra" />

      <!-- Tarjeta del formulario de compra -->
      <AppCard class="form-card q-mb-xl">
        <!-- Campo Fecha -->
        <div class="input-block q-mb-md">
          <label
            for="movimiento-fecha"
            class="field-label block text-weight-medium text-grey-8 q-mb-xs"
          >
            Fecha
          </label>
          <div class="date-input-box row items-center no-wrap q-px-md">
            <input
              id="movimiento-fecha"
              v-model="form.fecha"
              type="text"
              class="native-date-input col"
              placeholder="DD/MM/AAAA"
            />
            <AppButton
              icon="calendar_today"
              aria-label="Abrir calendario"
              variant="ghost"
              size="md"
              class="ksm-touch"
              icon-only
            >
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="form.fecha" mask="DD/MM/YYYY">
                  <div class="row items-center justify-end">
                    <AppButton v-close-popup label="Cerrar" variant="ghost" size="md" />
                  </div>
                </q-date>
              </q-popup-proxy>
            </AppButton>
          </div>
        </div>

        <!-- Selección o creación local de granja -->
        <div class="input-block q-mb-md">
          <ClienteSelect v-model="form.granja" tipo="granja" label="Granja" />
        </div>

        <!-- Fila de Precios: Rosado, Pardo, Jumbo -->
        <div class="input-block q-mb-xs">
          <div class="row q-col-gutter-sm">
            <!-- Rosado S/ kg -->
            <div class="col-4">
              <label
                for="precio-rosado"
                class="field-label block text-weight-medium text-grey-8 q-mb-xs text-caption ellipsis"
              >
                Rosado S/ kg
              </label>
              <div class="price-input-box row items-center q-px-sm">
                <input
                  id="precio-rosado"
                  v-model.number="form.rosadoPrecio"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  class="native-price-input col text-center"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Pardo S/ kg -->
            <div class="col-4">
              <label
                for="precio-pardo"
                class="field-label block text-weight-medium text-grey-8 q-mb-xs text-caption ellipsis"
              >
                Pardo S/ kg
              </label>
              <div class="price-input-box row items-center q-px-sm">
                <input
                  id="precio-pardo"
                  v-model.number="form.pardoPrecio"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  class="native-price-input col text-center"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Jumbo S/ kg -->
            <div class="col-4">
              <label
                for="precio-jumbo"
                class="field-label block text-weight-medium text-grey-8 q-mb-xs text-caption ellipsis"
              >
                Jumbo S/ kg
              </label>
              <div class="price-input-box row items-center q-px-sm">
                <input
                  id="precio-jumbo"
                  v-model.number="form.jumboPrecio"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  class="native-price-input col text-center"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- Leyenda de ayuda -->
          <div class="help-caption text-grey-6 text-caption q-mt-xs">
            Precio de compra por kg (opcional).
          </div>
        </div>
      </AppCard>

      <!-- Botón inferior fijo según la imagen 2 -->
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
          :label="submitButtonText"
        ></AppButton>
      </AppButtonRow>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { reactive, computed } from 'vue';
import { fechaLima, fechaVisible } from '@/domain/model';
import ViajeHeaderNav from '../components/ViajeHeaderNav.vue';
import MovimientoTypeToggle from '../components/MovimientoTypeToggle.vue';
import ClienteSelect from '../components/ClienteSelect.vue';
import { useViaje } from '../composables/useViaje';
import type { CompraFormData } from '../types';

const { loading, registrarCompra } = useViaje();

const form = reactive<CompraFormData>({
  fecha: fechaVisible(fechaLima()),
  granja: '',
  rosadoPrecio: undefined,
  pardoPrecio: undefined,
  jumboPrecio: undefined,
  kilosTotal: 0,
  paquetesTotal: 0,
});

const canSubmit = computed(() => {
  return form.granja.trim().length > 0;
});

const submitButtonText = computed(() => {
  if (!canSubmit.value) {
    return 'Elige una granja';
  }
  return `Crear y empezar a anotar`;
});

async function handleSubmit() {
  await registrarCompra(form);
}
</script>

<style scoped>
.compra-page {
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

.date-input-box,
.text-input-box {
  height: 48px;
  background-color: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.date-input-box:focus-within,
.text-input-box:focus-within {
  background-color: #ffffff;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.12);
}

.price-input-box {
  height: 46px;
  background-color: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.price-input-box:focus-within {
  background-color: #ffffff;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.12);
}

.native-date-input,
.native-text-input,
.native-price-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: #0f172a;
  width: 100%;
  font-family: inherit;
}

.native-date-input::placeholder,
.native-text-input::placeholder,
.native-price-input::placeholder {
  color: #94a3b8;
}

.help-caption {
  font-size: 0.78rem;
}

/* Botón inferior fijo */

@media (min-width: 1024px) {
}
</style>

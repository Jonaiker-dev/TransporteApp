<template>
  <q-page class="viaje-page bg-surface q-px-md q-py-md flex justify-center">
    <div class="content-wrapper full-width">
      <!-- Encabezado con ruta y navegación -->
      <ViajeHeaderNav back-to="/" back-text="Inicio" />

      <!-- Tarjeta principal del viaje en curso -->
      <AppCard class="viaje-card q-mb-lg">
        <div class="row items-center justify-between q-mb-md">
          <span class="text-h6 text-weight-bold text-grey-10"> Viaje {{ resumen.fecha }} </span>
          <div class="en-curso-badge q-px-sm q-py-xs text-caption text-weight-medium">
            {{ resumen.estado }}
          </div>
        </div>

        <!-- Tres cajas de métricas -->
        <div class="row q-col-gutter-sm">
          <!-- Comprado -->
          <div class="col-4">
            <AppCard class="metric-card">
              <span class="metric-label text-grey-7 text-caption">Comprado</span>
              <span class="metric-value text-weight-bolder text-grey-9">
                {{ resumen.compradoKg.toFixed(2) }}
              </span>
              <span class="metric-sub text-grey-6 text-caption">
                kg · {{ resumen.compradoPaq }} paq.
              </span>
            </AppCard>
          </div>

          <!-- Vendido -->
          <div class="col-4">
            <AppCard class="metric-card">
              <span class="metric-label text-grey-7 text-caption">Vendido</span>
              <span class="metric-value text-weight-bolder text-grey-9">
                {{ resumen.vendidoKg.toFixed(2) }}
              </span>
              <span class="metric-sub text-grey-6 text-caption">
                kg · {{ resumen.vendidoPaq }} paq.
              </span>
            </AppCard>
          </div>

          <!-- Movimientos -->
          <div class="col-4">
            <AppCard class="metric-card">
              <span class="metric-label text-grey-7 text-caption">Movimientos</span>
              <span class="metric-value text-weight-bolder text-grey-9">
                {{ movimientos.length }}
              </span>
              <span class="metric-sub text-grey-6 text-caption">en el viaje</span>
            </AppCard>
          </div>
        </div>
      </AppCard>

      <q-banner v-if="error || mensaje" class="bg-red-1 text-negative q-mb-md">{{
        error || mensaje
      }}</q-banner
      ><q-banner v-if="!viaje && ready" class="q-mb-md"
        >Sin viaje abierto. Inícialo desde Inicio.</q-banner
      >
      <div v-if="viaje" class="q-mb-md">
        <ResultadoGanancia :resultado="resultado.resultado" />
        <div class="text-caption">En camión, a costo: {{ soles(inventario.costo) }}</div>
        <AppButton
          v-if="viaje.estado === 'CERRADO' && !abierto"
          label="Reabrir viaje"
          @click="reabrir"
          variant="secondary"
          size="md"
        />
        <AppButtonRow class="q-mt-sm" label="Acciones">
          <VistaPreviaPdf :id="viaje.id" por-viaje />
          <AppButton
            label="PDF del viaje"
            :loading="exportando"
            @click="exportar('pdf')"
            variant="secondary"
            size="md"
          /><AppButton
            label="Excel del viaje"
            :loading="exportando"
            @click="exportar('xlsx')"
            variant="secondary"
            size="md"
          /><AppButton label="Respaldo JSON" @click="respaldo" variant="ghost" size="md" />
        </AppButtonRow>
      </div>
      <!-- Sección de Movimientos -->
      <section class="movimientos-section q-mb-xl">
        <div class="row items-center justify-between q-mb-sm">
          <span class="section-title text-weight-bold text-grey-9">Movimientos</span>
          <span v-if="movimientos.length > 0" class="text-caption text-grey-6">
            {{ movimientos.length }} registrados
          </span>
        </div>

        <q-input
          v-model="busqueda"
          outlined
          dense
          label="Buscar por cliente o granja"
          class="q-mb-md"
        /><!-- Si no hay movimientos -->
        <AppCard v-if="!ready" role="status">Cargando movimientos…</AppCard>
        <AppCard
          v-else-if="movimientos.length === 0"
          class="empty-movimientos text-grey-7 text-body2"
        >
          No hay movimientos en este viaje.
        </AppCard>

        <!-- Si hay movimientos registrados -->
        <div v-else class="movimientos-list">
          <MovimientoCard
            v-for="(item, index) in filtrados"
            :key="item.id ?? index"
            :movimiento="item"
            @open-movement="openMovement"
            @edit-flete="editFreight"
          />
        </div>
      </section>

      <!-- Barra de acciones fija al fondo según la imagen -->
      <AppButtonRow
        class="bottom-actions-container"
        label="Acciones"
        layout="primary-first"
        fixed
        size="md"
        above-navigation
      >
        <AppButton
          type="button"
          aria-label="Registrar nuevo movimiento de compra o venta"
          :disabled="!viaje || viaje.estado !== 'ABIERTO'"
          @click="openNewMovement"
          variant="primary"
          size="md"
          block
        >
          <q-icon name="add" size="20px" class="q-mr-xs" />
          <span>Nuevo</span>
        </AppButton>
        <AppButton
          type="button"
          :disabled="!viaje || viaje.estado !== 'ABIERTO'"
          @click="cerrarViaje"
          variant="secondary"
          size="md"
          block
        >
          <span>Cerrar viaje</span>
        </AppButton>
      </AppButtonRow>
    </div>

    <!-- Modal para seleccionar tipo de nuevo movimiento -->
    <q-dialog v-model="chooseMovementTypeDialog" position="bottom">
      <AppCard style="max-width: 440px; width: 100%" class="dialog-card">
        <div class="text-h6 text-weight-bold q-mb-md">Selecciona el tipo de movimiento</div>
        <AppButtonRow label="Acciones del viaje"
          ><AppButton
            icon="add_shopping_cart"
            label="Compra en granja"
            to="/viaje/compra"
            variant="primary"
            size="md"
            block />
          <AppButton
            icon="point_of_sale"
            label="Venta en Lima"
            to="/viaje/venta"
            variant="primary"
            size="md"
            block
        /></AppButtonRow>
      </AppCard>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ViajeHeaderNav from '../components/ViajeHeaderNav.vue';
import MovimientoCard from '../components/MovimientoCard.vue';
import ResultadoGanancia from '@/components/ResultadoGanancia.vue';
import VistaPreviaPdf from '@/components/VistaPreviaPdf.vue';
import { useTransporte } from '@/composables/useTransporte';
import { proyectarViaje } from '../api';
import { reabrirViaje, respaldoViaje } from '@/repositories/transporte';
import { normalizarNombre } from '@/domain/model';
import { soles } from '@/domain/ganancia';
import type { Movimiento } from '../types';
const router = useRouter();
const route = useRoute();
const { data, abierto, ready, error, inventario, resumenViaje } = useTransporte();
const viaje = computed(
  () => data.value.viajes.find((v) => v.id === route.query.id) ?? abierto.value,
);
const resultado = computed(() => resumenViaje(viaje.value?.id ?? ''));
const vista = computed(() => proyectarViaje(data.value, viaje.value?.id));
const movimientos = computed(() => vista.value.movimientos);
const resumen = computed(() => vista.value.resumen);
const chooseMovementTypeDialog = ref(false);
const busqueda = ref('');
const mensaje = ref('');
const exportando = ref(false);
const filtrados = computed(() =>
  movimientos.value.filter((m) =>
    normalizarNombre(m.entidad).includes(normalizarNombre(busqueda.value)),
  ),
);
function openNewMovement() {
  chooseMovementTypeDialog.value = true;
}
function openMovement(m: Movimiento) {
  if (m.id) void router.push(`/viaje/${m.tipo}/${m.id}`);
}
function editFreight(m: Movimiento) {
  openMovement(m);
}
function cerrarViaje() {
  void router.push('/viaje/cierre');
}
async function reabrir() {
  if (!viaje.value) return;
  try {
    await reabrirViaje(viaje.value.id);
    await router.replace('/viaje');
  } catch (err) {
    mensaje.value = err instanceof Error ? err.message : 'No se pudo reabrir.';
  }
}
async function exportar(formato: 'pdf' | 'xlsx') {
  if (!viaje.value) return;
  exportando.value = true;
  try {
    const { exportarViaje } = await import('@/services/exportaciones');
    await exportarViaje(viaje.value.id, formato);
  } catch (err) {
    mensaje.value = err instanceof Error ? err.message : 'No se pudo exportar.';
  } finally {
    exportando.value = false;
  }
}
async function respaldo() {
  if (!viaje.value) return;
  try {
    const { compartirArchivo } = await import('@/services/exportaciones');
    const value = await respaldoViaje(viaje.value.id);
    await compartirArchivo(
      new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
      `viaje-${viaje.value.fecha_inicio}.json`,
    );
  } catch (err) {
    mensaje.value = err instanceof Error ? err.message : 'No se pudo respaldar.';
  }
}
</script>

<style scoped>
.viaje-page {
  width: 100%;
}

.content-wrapper {
  max-width: 480px;
  padding-bottom: 160px;
}

.en-curso-badge {
  background-color: #e0f2fe;
  color: #0284c7;
  border: 1px solid #bae6fd;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.metric-card {
  min-height: 90px;
}

.metric-label {
  font-size: 0.74rem;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 1.15rem;
  line-height: 1.1;
}

.metric-sub {
  font-size: 0.7rem;
  margin-top: 2px;
}

.section-title {
  font-size: 1.1rem;
}

/* Barra inferior fija */

.movement-dialog {
  width: min(100%, 480px);
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 20px 20px 0 0;
}

@media (min-width: 1024px) {
  .content-wrapper {
    padding-bottom: 90px;
  }
}

@media (min-width: 600px) {
  .movement-dialog {
    border-radius: 20px;
  }
}
</style>

<template>
  <q-page class="home-page-container q-px-md q-py-sm flex justify-center">
    <div class="content-wrapper full-width">
      <!-- 1. CABECERA DE FECHA Y RUTA -->
      <section class="route-header-section q-mb-md">
        <!-- Fecha en mayúsculas pequeñas -->
        <div class="date-label text-weight-bold text-uppercase text-grey-6 q-mb-xs">
          {{ formattedDate }}
        </div>

        <!-- Título de la ruta: Chincha -> Lima con badge IDA -->
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap route-title-row">
            <span class="route-city text-weight-bolder">Chincha</span>
            <q-icon name="arrow_forward" size="22px" class="route-arrow q-mx-xs" />
            <span class="route-city text-weight-bolder">Lima</span>
          </div>

          <!-- Badge IDA -->
          <div class="ida-badge row items-center q-px-sm q-py-xs">
            <q-icon name="near_me" size="14px" class="q-mr-xs text-primary" />
            <span class="text-weight-bold text-primary text-caption">IDA</span>
          </div>
        </div>

        <!-- Descripción de la carga / ruta -->
        <div class="route-description text-grey-7 q-mt-xs">
          Huevos frescos · retorno con mercadería general
        </div>

        <!-- Notificación de conductor autenticado en Pinia -->
        <div v-if="authStore.isAuthenticated" class="driver-info-badge q-mt-xs row items-center">
          <q-icon name="verified_user" size="15px" color="positive" class="q-mr-xs" />
          <span class="text-caption text-grey-8">
            Conductor en ruta: <strong>{{ authStore.userName }}</strong>
          </span>
        </div>
      </section>

      <EstadoRespaldo :pendientes="data.pendientes" /><q-banner
        v-if="error || mensaje"
        class="bg-red-1 text-negative q-mb-md"
        >{{ error || mensaje }}</q-banner
      ><q-banner v-if="abierto && dias >= 3" class="bg-amber-1 q-mb-md"
        >Este viaje lleva {{ dias }} días abierto. Recuerda revisar su cierre.</q-banner
      ><!-- 2. TARJETA PRINCIPAL: VIAJE EN CURSO -->
      <section class="q-mb-lg">
        <AppCard v-if="abierto" class="trip-card">
          <!-- Cabecera de la tarjeta -->
          <div class="row items-center justify-between q-mb-xs">
            <span class="trip-card-title text-weight-bold">Viaje en curso</span>
            <!-- Pill Dia 1 con punto verde -->
            <div class="day-badge row items-center q-px-sm q-py-xs">
              <span class="green-dot q-mr-xs" />
              <span class="text-weight-medium">Día {{ dias }}</span>
            </div>
          </div>

          <!-- Subtítulo de la ruta -->
          <div class="trip-card-subtitle text-grey-6 q-mb-md">
            Chincha ➔ Lima · inicio {{ fechaVisible(abierto.fecha_inicio) }} ·
            {{ tripStats.movimientos }} movimientos
          </div>

          <!-- TRES CAJAS DE MÉTRICAS (Comprado, Vendido, En camión) -->
          <div class="row q-col-gutter-xs q-mb-md">
            <!-- 1. Comprado -->
            <div class="col-4">
              <AppCard class="metric-box">
                <div class="metric-icon-circle bg-blue-1 flex flex-center q-mb-xs">
                  <q-icon name="arrow_downward" size="17px" color="primary" />
                </div>
                <div class="metric-label text-grey-7 text-caption">Comprado</div>
                <div class="metric-value text-weight-bolder text-grey-9">
                  {{ tripStats.comprado.toFixed(2) }}
                </div>
                <div class="metric-sub text-grey-6">kg · {{ tripStats.compradoPaq }} paq.</div>
              </AppCard>
            </div>

            <!-- 2. Vendido -->
            <div class="col-4">
              <AppCard class="metric-box">
                <div class="metric-icon-circle bg-green-1 flex flex-center q-mb-xs">
                  <q-icon name="arrow_upward" size="17px" color="positive" />
                </div>
                <div class="metric-label text-grey-7 text-caption">Vendido</div>
                <div class="metric-value text-weight-bolder text-grey-9">
                  {{ tripStats.vendido.toFixed(2) }}
                </div>
                <div class="metric-sub text-grey-6">kg · {{ tripStats.vendidoPaq }} paq.</div>
              </AppCard>
            </div>

            <!-- 3. En camión -->
            <div class="col-4">
              <AppCard class="metric-box">
                <div class="metric-icon-circle bg-blue-1 flex flex-center q-mb-xs">
                  <q-icon name="local_shipping" size="17px" color="primary" />
                </div>
                <div class="metric-label text-grey-7 text-caption">En camión</div>
                <div class="metric-value text-weight-bolder text-grey-9">
                  {{ tripStats.enCamion.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </div>
                <div class="metric-sub text-grey-6">kg · {{ stock.length }} paq.</div>
              </AppCard>
            </div>
          </div>

          <div class="q-mb-md">
            Vendido: <strong>{{ soles(resumen.ingreso) }}</strong
            ><ResultadoGanancia :resultado="resumen.resultado" />
            <div class="text-caption q-mt-xs">
              En camión, a costo: {{ soles(inventario.costo)
              }}<span v-if="inventario.excluidos">
                · {{ inventario.excluidos }} paq. sin costo</span
              >
            </div>
          </div>
          <!-- BOTÓN PRINCIPAL: Continuar viaje con flecha -->
          <AppButton
            type="button"
            @click="handleContinueTrip"
            variant="primary"
            size="lg"
            block
            class="q-mb-sm"
            data-testid="continue-trip"
          >
            <span>Continuar viaje</span>
            <q-icon name="arrow_forward" size="19px" class="q-ml-sm" />
          </AppButton>

          <!-- BOTONES SECUNDARIOS: + Compra y Venta -->
          <AppButtonRow label="Atajos del viaje"
            ><AppButton
              type="button"
              @click="openPurchaseDialog"
              variant="secondary"
              size="md"
              block
              data-testid="purchase-shortcut"
            >
              <q-icon name="add" size="20px" color="primary" class="q-mr-xs" />
              <span class="text-weight-bold text-grey-9">Compra</span>
            </AppButton>
            <AppButton type="button" @click="openSaleDialog" variant="secondary" size="md" block>
              <q-icon name="reply" size="20px" color="teal" class="q-mr-xs" />
              <span class="text-weight-bold text-grey-9">Venta</span>
            </AppButton></AppButtonRow
          ><AppButtonRow class="q-mt-sm" label="Flete"
            ><AppButton
              type="button"
              @click="router.push('/viaje/flete')"
              variant="secondary"
              size="md"
              block
            >
              <q-icon name="local_shipping" size="20px" color="orange-9" class="q-mr-xs" />
              <span class="text-weight-bold text-grey-9">Registrar flete</span>
            </AppButton></AppButtonRow
          >
        </AppCard>
      </section>

      <AppButton
        v-if="!abierto && ready"
        label="Iniciar viaje"
        :loading="busy"
        @click="iniciar"
        variant="primary"
        size="md"
        block
        class="q-mb-lg"
      /><AppCard class="ksm-card q-mb-md"
        ><strong>En el camión ahora</strong>
        <div v-for="t in tipos" :key="t" class="row justify-between q-mt-xs">
          <span>{{ nombres[t] }}</span
          ><span
            >{{ stock.filter((p) => p.tipo === t).length }} paq. ·
            {{ formatPeso(stock.filter((p) => p.tipo === t).reduce((s, p) => s + p.peso_c, 0)) }}
            kg</span
          >
        </div></AppCard
      >
      <div
        v-if="resumen.movimientos.some((m) => m.estado === 'EN_CURSO')"
        class="text-orange-9 q-mb-md"
      >
        Hay movimientos pendientes de terminar. Abre el viaje para continuar.
      </div>
      <section v-if="recientes.length" class="q-mb-lg">
        <strong>Últimos movimientos</strong
        ><q-list
          ><q-item v-for="m in recientes" :key="m.id" clickable @click="abrirMovimiento(m)"
            ><q-item-section
              >{{ m.tipo }} · {{ data.partes.find((p) => p.id === m.parte_id)?.nombre
              }}<q-item-label caption>{{
                m.estado === 'EN_CURSO' ? 'En curso' : 'Terminado'
              }}</q-item-label></q-item-section
            ><q-item-section side><q-icon name="chevron_right" /></q-item-section></q-item
        ></q-list>
      </section>
      <!-- 3. SECCIÓN: VIAJES ANTERIORES -->
      <section class="previous-trips-section q-mb-xl">
        <!-- Título y contador -->
        <div class="row items-center justify-between q-mb-xs">
          <span class="section-title text-weight-bold">Viajes anteriores</span>
          <div class="records-badge q-px-sm q-py-xs text-caption">
            {{ previousTrips.length }} registros
          </div>
        </div>

        <div class="section-subtitle text-grey-6 q-mb-sm">Historial reciente de la ruta</div>

        <!-- Tarjetas de historial -->
        <div class="q-gutter-y-sm">
          <AppCard
            v-for="(trip, index) in previousTrips"
            :key="index"
            @click="viewTripDetail(trip)"
            class="history-card cursor-pointer"
          >
            <div class="row items-center justify-between q-mb-xs">
              <span class="history-title text-weight-bold text-grey-9">
                {{ trip.title }}
              </span>
              <div class="closed-badge q-px-sm q-py-xs text-caption">
                {{ trip.status }}
              </div>
            </div>
            <div class="history-detail text-grey-7 text-caption">
              {{ trip.detail }}
            </div>
          </AppCard>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTransporte } from '@/composables/useTransporte';
import { iniciarViaje } from '@/repositories/transporte';
import { diaViaje, fechaVisible, tipos, nombres, type Movimiento } from '@/domain/model';
import { formatPeso } from '@/domain/pesos';
import { soles } from '@/domain/ganancia';
import ResultadoGanancia from '@/components/ResultadoGanancia.vue';
import EstadoRespaldo from '@/components/EstadoRespaldo.vue';
const router = useRouter();
const authStore = useAuthStore();
const { data, abierto, stock, inventario, resumenViaje, ready, error } = useTransporte();
const mensaje = ref('');
const busy = ref(false);
const formattedDate = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
  .format(new Date())
  .toUpperCase();
const resumen = computed(() => resumenViaje(abierto.value?.id ?? ''));
const dias = computed(() => (abierto.value ? diaViaje(abierto.value.fecha_inicio) : 0));
const tripStats = computed(() => ({
  comprado: resumen.value.comprado.reduce((s, p) => s + p.peso_c, 0) / 100,
  vendido: resumen.value.vendido.reduce((s, p) => s + p.peso_c, 0) / 100,
  enCamion: stock.value.reduce((s, p) => s + p.peso_c, 0) / 100,
  compradoPaq: resumen.value.comprado.length,
  vendidoPaq: resumen.value.vendido.length,
  movimientos: resumen.value.movimientos.length,
}));
const previousTrips = computed(() =>
  data.value.viajes
    .filter((v) => v.estado === 'CERRADO')
    .map((v) => {
      const r = resumenViaje(v.id);
      return {
        id: v.id,
        title: `Viaje ${fechaVisible(v.fecha_inicio)} al ${fechaVisible(v.fecha_fin ?? v.fecha_inicio)}`,
        status: 'Cerrado',
        detail: `${r.movimientos.length} movimientos · Ganancia ${r.resultado.ganancia >= 0 ? '+' : '−'}${soles(Math.abs(r.resultado.ganancia))}${v.nota ? ' · Histórico sin detalle de pesos' : ''}`,
      };
    }),
);
const recientes = computed(() =>
  [...data.value.movimientos].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
);
async function iniciar() {
  busy.value = true;
  try {
    await iniciarViaje();
    mensaje.value = '';
  } catch (err) {
    mensaje.value = err instanceof Error ? err.message : 'No se pudo iniciar.';
  } finally {
    busy.value = false;
  }
}
function handleContinueTrip() {
  void router.push('/viaje');
}
function openPurchaseDialog() {
  void router.push('/viaje/compra');
}
function openSaleDialog() {
  void router.push('/viaje/venta');
}
function viewTripDetail(trip: { id: string }) {
  void router.push({ path: '/viaje', query: { id: trip.id } });
}
function abrirMovimiento(m: Movimiento) {
  void router.push(`/viaje/${m.tipo.toLowerCase()}/${m.id}`);
}
</script>

<style scoped>
.home-page-container {
  width: 100%;
}

.content-wrapper {
  max-width: 480px;
}

/* 1. Cabecera de Ruta */
.date-label {
  font-size: 0.73rem;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #64748b;
}

.route-city {
  font-size: 1.7rem;
  line-height: 1.15;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.route-arrow {
  color: #00bcd4;
}

.ida-badge {
  background-color: #e0f2fe;
  border-radius: 9999px;
  border: 1px solid rgba(186, 230, 253, 0.8);
}

.route-description {
  font-size: 0.82rem;
  color: #64748b;
}

.driver-info-badge {
  background-color: #f1f5f9;
  border-radius: 8px;
  padding: 3px 8px;
  display: inline-flex;
}

/* 2. Tarjeta Viaje en Curso */

.trip-card-title {
  font-size: 1.12rem;
  letter-spacing: -0.01em;
}

.day-badge {
  background-color: #dcfce7;
  color: #15803d;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
}

.green-dot {
  width: 6.5px;
  height: 6.5px;
  border-radius: 50%;
  background-color: #22c55e;
}

.trip-card-subtitle {
  font-size: 0.78rem;
  line-height: 1.3;
}

/* Cajas de métricas */
.metric-box {
  min-height: 104px;
}

.metric-icon-circle {
  width: 30px;
  height: 30px;
  border-radius: 10px;
}

.metric-label {
  font-size: 0.74rem;
  color: #64748b;
  margin-bottom: 2px;
}

.metric-value {
  font-size: 1.05rem;
  line-height: 1.1;
  color: #0f172a;
}

.metric-sub {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 2px;
}

/* Botón Continuar viaje */

/* Botones secundarios (+ Compra, Venta) */

/* 3. Sección Viajes Anteriores */
.section-title {
  font-size: 1.12rem;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.records-badge {
  background-color: #f1f5f9;
  color: #64748b;
  border-radius: 9999px;
  font-weight: 500;
}

.section-subtitle {
  font-size: 0.8rem;
}

.history-card {
  transition: all 0.2s ease;
}

.history-title {
  font-size: 0.88rem;
}

.closed-badge {
  border: 1px solid #e2e8f0;
  color: #64748b;
  border-radius: 9999px;
  background-color: #f8fafc;
  font-size: 0.72rem;
}

.history-detail {
  font-size: 0.78rem;
}
</style>

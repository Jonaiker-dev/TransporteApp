<template>
  <q-page class="q-pa-md"
    ><div class="ksm-content">
      <ViajeHeaderNav back-to="/viaje" back-text="Volver" />
      <h1 class="text-h5 text-weight-bold">Cierre de viaje</h1>
      <q-banner v-if="mensaje || error" class="bg-red-1 text-negative q-mb-md">{{
        mensaje || error
      }}</q-banner>
      <AppCard v-if="abierto" class="ksm-card"
        ><div class="text-subtitle1 text-weight-bold q-mb-sm">Cuadre por tipo</div>
        <div class="table-scroll">
          <table class="ksm-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Comprado kg</th>
                <th>Vendido kg</th>
                <th>Camión kg</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tipos" :key="t">
                <td>{{ nombres[t] }}</td>
                <td>{{ peso(resumen.comprado, t) }}</td>
                <td>{{ peso(resumen.vendido, t) }}</td>
                <td>{{ peso(stock, t) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          El stock del camión incluye remanentes de viajes anteriores. Lo restante seguirá
          disponible en el próximo viaje.
        </div>
        <ResultadoGanancia :resultado="resumen.resultado" />
        <div class="table-scroll q-mt-sm">
          <table class="ksm-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Venta</th>
                <th>Costo</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in resumen.resultado.porTipo" :key="r.tipo">
                <td>{{ nombres[r.tipo] }}</td>
                <td>{{ soles(r.ingreso) }}</td>
                <td>{{ soles(r.costo) }}</td>
                <td>{{ r.ganancia >= 0 ? '+' : '−' }}{{ soles(Math.abs(r.ganancia)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="q-my-md">
          En camión, a costo: <strong>{{ soles(inventario.costo) }}</strong>
          <div v-if="inventario.excluidos" class="text-caption">
            {{ inventario.excluidos }} paquetes sin costo conocido.
          </div>
        </div>
        <q-banner v-if="pendientes" class="bg-amber-1 q-mb-md"
          >Hay {{ pendientes }} movimientos en curso. Termínalos o cancélalos antes de
          cerrar.</q-banner
        >
        <AppButtonRow fixed above-navigation size="lg" label="Cierre de viaje"
          ><AppButton
            label="Cerrar viaje"
            :disabled="pendientes > 0"
            :loading="busy"
            @click="cerrar"
            variant="primary"
            size="md"
            block /></AppButtonRow
      ></AppCard>
      <q-banner v-else>Sin viaje abierto.</q-banner>
    </div></q-page
  >
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTransporte } from '@/composables/useTransporte';
import { cerrarViaje } from '@/repositories/transporte';
import { tipos, nombres, type TipoHuevo, type Paquete } from '@/domain/model';
import { soles } from '@/domain/ganancia';
import { formatPeso } from '@/domain/pesos';
import ResultadoGanancia from '@/components/ResultadoGanancia.vue';
import ViajeHeaderNav from '../components/ViajeHeaderNav.vue';
const { abierto, stock, inventario, resumenViaje, error } = useTransporte();
const resumen = computed(() => resumenViaje(abierto.value?.id ?? ''));
const pendientes = computed(
  () => resumen.value.movimientos.filter((m) => m.estado === 'EN_CURSO').length,
);
const router = useRouter();
const busy = ref(false);
const mensaje = ref('');
const peso = (items: Paquete[], t: TipoHuevo) =>
  formatPeso(items.filter((p) => p.tipo === t).reduce((s, p) => s + p.peso_c, 0));
async function cerrar() {
  if (!abierto.value) return;
  busy.value = true;
  try {
    await cerrarViaje(abierto.value.id);
    await router.push('/');
  } catch (err) {
    mensaje.value = err instanceof Error ? err.message : 'No se pudo cerrar.';
  } finally {
    busy.value = false;
  }
}
</script>

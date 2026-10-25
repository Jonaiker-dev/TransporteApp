<template>
  <q-page class="capture-page">
    <div class="capture-content">
      <nav class="capture-navigation">
        <AppButton
          icon="arrow_back"
          :aria-label="origenMovimientos ? 'Volver a movimientos' : 'Volver al viaje'"
          :label="movimiento?.estado === 'EN_CURSO' ? undefined : 'Movimientos'"
          @click="volver"
          variant="ghost"
          size="md"
        />
        <div v-if="movimiento?.estado === 'EN_CURSO'" class="capture-context">
          <small>{{
            movimiento.tipo === 'COMPRA'
              ? 'Compra · En curso'
              : movimiento.tipo === 'VENTA'
                ? 'Venta · En curso'
                : 'Flete · En curso'
          }}</small>
          <h1>{{ nombre }}</h1>
        </div>
        <span v-else class="capture-brand">Transportes K.S.M</span>
      </nav>
      <q-banner v-if="error || accionError" class="capture-error q-mb-md" role="alert">
        {{ error || accionError }}
        <AppButton
          v-if="error"
          label="Reintentar"
          variant="secondary"
          size="md"
          @click="reintentarLectura"
        />
      </q-banner>
      <div v-if="!ready" class="capture-loading">
        <q-spinner color="primary" size="28px" /> Cargando movimiento…
      </div>
      <AppCard v-else-if="!movimiento" class="capture-panel">No se encontró el movimiento.</AppCard>
      <template v-else>
        <AppCard
          v-if="movimiento.estado !== 'EN_CURSO'"
          class="capture-panel movement-heading"
          tag="header"
        >
          <div class="movement-heading-row">
            <div class="movement-symbol" :class="movimiento.tipo.toLowerCase()">
              <q-icon
                :name="
                  movimiento.tipo === 'COMPRA'
                    ? 'south_west'
                    : movimiento.tipo === 'VENTA'
                      ? 'north_east'
                      : 'local_shipping'
                "
                size="20px"
              />
            </div>
            <div class="movement-title">
              <span class="movement-eyebrow">{{
                movimiento.tipo === 'COMPRA'
                  ? 'COMPRA EN GRANJA'
                  : movimiento.tipo === 'FLETE'
                    ? 'FLETE'
                    : 'VENTA EN LIMA'
              }}</span>
              <h1>{{ nombre }}</h1>
            </div>
            <span class="movement-state done">Terminado</span>
          </div>
          <div class="movement-date">
            {{ fechaVisible(movimiento.fecha)
            }}<span v-if="movimiento.tipo !== 'FLETE'">
              · {{ paquetes.length }} paq. · {{ formatPeso(pesoTotal) }} kg</span
            >
          </div>
          <PreciosMovimiento
            v-if="movimiento.tipo !== 'FLETE'"
            :movimiento="movimiento"
            :viaje-abierto="viajeAbierto"
            :tipos-usados="[...new Set(paquetes.map((p) => p.tipo))]"
          />
        </AppCard>
        <div v-if="movimiento.legacy_resumen" class="capture-note">
          Registro histórico: {{ formatPeso(movimiento.legacy_resumen.peso_c) }} kg ·
          {{ movimiento.legacy_resumen.paquetes }} paq. No contiene pesos individuales.
        </div>
        <AppCard v-if="movimiento.tipo === 'FLETE'" class="capture-panel">
          <h2>Paquetes del flete</h2>
          <div
            v-for="linea in data.fletes.filter((f) => f.movimiento_id === id)"
            :key="linea.id"
            class="freight-line"
          >
            <span>{{ nombres[linea.tipo] }}</span
            ><strong>{{ linea.cantidad }} paq.</strong>
          </div>
        </AppCard>
        <template v-if="movimiento.estado === 'EN_CURSO'">
          <AppCard v-if="conCompra" class="capture-panel farm-panel" tag="section" padding="none">
            <h2>Granja de origen</h2>
            <AppButtonRow class="granjas" label="Acciones">
              <AppButton
                v-for="g in granjas"
                :key="g.id"
                type="button"
                :aria-pressed="granja === g.id"
                @click="granja = g.id"
                variant="secondary"
                size="md"
              >
                {{ g.nombre
                }}<span>{{ disponiblesBase.filter((p) => p.granja_id === g.id).length }} paq.</span>
              </AppButton>
            </AppButtonRow>
            <p v-if="!granjas.length" class="capture-hint">
              No hay compras terminadas con stock disponible.
            </p>
          </AppCard>
          <TecladoPesos
            :marcar="conCompra"
            :etiqueta="nombres[tipo]"
            :busy="busy"
            :error="capturaError"
            :mensaje="mensaje"
            :ultimo="ultimo"
            @input="prefijo = $event"
            @submit="registrar"
            @undo="deshacer"
          >
            <template #tipos
              ><AppButtonRow class="type-selector" label="Tipo de huevo">
                <AppButton
                  v-for="t in tipos"
                  :key="t"
                  type="button"
                  :aria-pressed="tipo === t"
                  @click="tipo = t"
                  variant="secondary"
                  size="md"
                  :tone="t"
                  :label="t + ' ' + nombres[t]"
                ></AppButton>
              </AppButtonRow>
              <div class="type-counts">
                <span v-for="t in tipos" :key="t"
                  >{{ t }}:
                  {{
                    conCompra
                      ? disponiblesBase.filter((p) => p.tipo === t && p.granja_id === granja).length
                      : paquetes.filter((p) => p.tipo === t).length
                  }}
                  paq.</span
                >
              </div></template
            >
          </TecladoPesos>
          <template v-if="conCompra">
            <AppCard v-if="marcados.length" class="capture-panel q-mt-md" tag="section">
              <div class="section-heading">
                <h2>Marcados en esta venta</h2>
                <span>{{ marcados.length }} paq.</span>
              </div>
              <p class="capture-hint">Toca un peso para quitarlo si te equivocaste.</p>
              <AppButtonRow class="marked-weights" label="Acciones" :max-columns="2">
                <AppButton
                  v-for="(p, i) in marcados.slice(-8).reverse()"
                  :key="p.id"
                  type="button"
                  :aria-label="`Desmarcar ${formatPeso(p.peso_c)} kg, ${nombres[p.tipo]}, registro ${marcados.length - i}`"
                  :disabled="busy"
                  @click="desmarcar(p.id)"
                  variant="secondary"
                  size="md"
                >
                  <strong>{{ formatPeso(p.peso_c) }}</strong
                  ><span>{{ nombres[p.tipo] }} <q-icon name="close" size="12px" /></span>
                </AppButton>
              </AppButtonRow>
            </AppCard>
            <AppCard class="capture-panel available-panel q-mt-md" tag="section">
              <div class="section-heading">
                <h2>{{ nombres[tipo] }} disponibles</h2>
                <span>{{ disponibles.reduce((sum, p) => sum + p.cantidad, 0) }} paq.</span>
              </div>
              <p class="capture-hint">
                «×2» son dos paquetes del mismo peso. Cada toque marca uno, primero el de la compra
                más antigua.
              </p>
              <q-virtual-scroll
                v-if="disponibles.length"
                :items="filasDisponibles"
                :virtual-scroll-item-size="112"
                class="disponibles"
                #default="{ item, index }"
                ><AppButtonRow :key="index" class="available-row" label="Acciones" :max-columns="2">
                  <AppButton
                    v-for="p in item"
                    :key="p.peso_c"
                    type="button"
                    :aria-label="`Marcar ${formatPeso(p.peso_c)} kg, ${p.cantidad} disponibles`"
                    :disabled="busy"
                    @click="registrar(p.peso_c)"
                    variant="secondary"
                    size="md"
                    :label="formatPeso(p.peso_c) + ' ×' + p.cantidad"
                  ></AppButton> </AppButtonRow
              ></q-virtual-scroll>
              <div v-else class="empty-weights">
                {{
                  prefijo
                    ? `Sin coincidencias con «${prefijo}…».`
                    : 'No quedan pesos de este tipo en la granja seleccionada.'
                }}
              </div>
            </AppCard>
          </template>
        </template>
        <AppCard
          v-if="movimiento.tipo !== 'FLETE'"
          class="capture-panel weights-panel"
          tag="section"
        >
          <div class="section-heading">
            <h2>
              {{ movimiento.estado === 'TERMINADO' ? 'Detalle de pesos' : 'Pesos registrados' }}
            </h2>
            <span>{{ paquetes.length }} paq.</span>
          </div>
          <ColumnasPesos
            :paquetes="paquetes"
            :completo="movimiento.estado === 'TERMINADO'"
            :ultimo-id="ultimoId"
            :editable="viajeAbierto"
            :busy="busy"
            :guardar="guardarCorreccion"
            :motivo-bloqueo="motivoBloqueoPeso"
          />
          <p v-if="viajeAbierto" class="capture-hint">
            Toca un peso para corregirlo en su celda. Guarda o cancela el cambio antes de continuar.
          </p>
          <table v-if="totalesPorTipo.length" class="movement-type-totals">
            <caption>
              Totales por tipo
            </caption>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Peso</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="total in totalesPorTipo" :key="total.tipo" :data-tipo="total.tipo">
                <th scope="row">{{ nombres[total.tipo] }}</th>
                <td>{{ formatPeso(total.peso) }} kg</td>
                <td>{{ total.valor === null ? 'Sin precio' : soles(total.valor) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="weights-grand-total">
            <span>Total</span><strong>{{ formatPeso(pesoTotal) }} <small>kg</small></strong>
          </div>
          <div class="movement-amount">
            <span>{{ movimiento.tipo === 'COMPRA' ? 'Importe de compra' : 'Total de venta' }}</span
            ><strong>{{ soles(totalMovimiento(movimiento)) }}</strong>
          </div>
          <ResultadoGanancia v-if="movimiento.tipo === 'VENTA'" :resultado="resultado" />
          <p
            v-if="movimiento.tipo === 'VENTA' && !movimiento.tiene_pesos_compra"
            class="capture-hint q-mt-sm"
          >
            Sin pesos de compra: costo desconocido, excluido de la ganancia.
          </p>
        </AppCard>
        <AppCard class="capture-panel document-panel" tag="section">
          <template v-if="movimiento.estado === 'EN_CURSO'">
            <p class="capture-hint">{{ fechaVisible(movimiento.fecha) }}</p>
            <PreciosMovimiento
              v-if="movimiento.tipo !== 'FLETE'"
              :movimiento="movimiento"
              :viaje-abierto="viajeAbierto"
              :tipos-usados="[...new Set(paquetes.map((p) => p.tipo))]"
              compact
            />
          </template>
          <div class="section-heading">
            <h2>Comprobante</h2>
            <span v-if="movimiento.estado === 'EN_CURSO'">Borrador</span>
          </div>
          <p class="capture-hint">Revisa el documento aquí o descarga el archivo directamente.</p>
          <AppButtonRow class="document-actions" label="Acciones">
            <VistaPreviaPdf :id="id" /><ExportarPdf :id="id" /><AppButton
              v-if="movimiento.estado === 'TERMINADO'"
              label="Exportar Excel"
              :loading="exportando"
              @click="exportar('xlsx')"
              variant="ghost"
              size="md"
            />
          </AppButtonRow>
        </AppCard>
        <AppButton
          v-if="movimiento.estado === 'EN_CURSO'"
          type="button"
          :disabled="busy"
          @click="confirmarCancelacion"
          variant="secondary"
          size="md"
          block
        >
          Cancelar movimiento
        </AppButton>
        <AppButtonRow
          v-if="movimiento.estado === 'EN_CURSO'"
          class="capture-footer"
          label="Acciones"
          fixed
          size="lg"
        >
          <template #summary
            ><div class="footer-totals">
              <strong class="movement-date"
                >{{ paquetes.length }} paq. <span>·</span> {{ formatPeso(pesoTotal) }} kg</strong
              ><span
                >{{ soles(totalMovimiento(movimiento))
                }}<span v-if="movimiento.tipo === 'VENTA'" class="footer-gain">
                  · Ganancia: {{ resultado.ganancia >= 0 ? '+' : '−'
                  }}{{ soles(Math.abs(resultado.ganancia)) }}</span
                ></span
              >
            </div></template
          >
          <AppButton
            :label="movimiento.tipo === 'COMPRA' ? 'Terminar compra' : 'Confirmar venta'"
            :loading="busy"
            :disabled="!paquetes.length"
            @click="terminar"
            variant="primary"
            size="md"
          />
        </AppButtonRow>
      </template>
    </div>
  </q-page>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useTransporte } from '@/composables/useTransporte';
import { tipos, nombres, fechaVisible, type TipoHuevo, type Paquete } from '@/domain/model';
import { formatPeso, medianaPorTipo, esOutlier } from '@/domain/pesos';
import { costoPaquete, ganancia, soles } from '@/domain/ganancia';
import {
  agregarPeso,
  corregirPeso,
  marcarPeso,
  deshacerPeso,
  terminarMovimiento,
  cancelarMovimiento,
} from '@/repositories/transporte';
import ColumnasPesos from '@/components/ColumnasPesos.vue';
import TecladoPesos from '@/components/TecladoPesos.vue';
import ResultadoGanancia from '@/components/ResultadoGanancia.vue';
import PreciosMovimiento from '@/components/PreciosMovimiento.vue';
import VistaPreviaPdf from '@/components/VistaPreviaPdf.vue';
import ExportarPdf from '@/components/ExportarPdf.vue';
const props = defineProps<{ id: string }>();
const router = useRouter();
const route = useRoute();
const origenMovimientos = computed(() => {
  const destino = route.query.volver;
  if (typeof destino !== 'string' || !/^\/movimientos(?:\/buscar)?(?:\?|$)/.test(destino))
    return '';
  return destino;
});
const $q = useQuasar();
const { data, ready, error, paquetesMovimiento, totalMovimiento, reintentarLectura } =
  useTransporte();
const movimiento = computed(() => data.value.movimientos.find((m) => m.id === props.id));
const viajeAbierto = computed(() =>
  data.value.viajes.some((v) => v.id === movimiento.value?.viaje_id && v.estado === 'ABIERTO'),
);
function motivoBloqueoPeso(p: Paquete): string {
  for (const id of [p.compra_mov_id, p.venta_mov_id].filter((id) => id !== null)) {
    const m = data.value.movimientos.find((item) => item.id === id);
    const viaje = data.value.viajes.find((item) => item.id === m?.viaje_id);
    if (!m || !viaje || viaje.estado !== 'ABIERTO')
      return 'La compra o venta pertenece a un viaje cerrado. No se puede corregir este peso.';
  }
  return '';
}
async function guardarCorreccion(p: Paquete, tipo: TipoHuevo, peso: number) {
  if (busy.value) throw new Error('Espera a que termine la operacion actual.');
  busy.value = true;
  try {
    await corregirPeso(props.id, p.id, tipo, peso);
    ultimo.value = '';
    ultimoId.value = p.id;
  } finally {
    busy.value = false;
  }
}
const nombre = computed(
  () => data.value.partes.find((p) => p.id === movimiento.value?.parte_id)?.nombre ?? 'Movimiento',
);
const paquetes = computed(() => (movimiento.value ? paquetesMovimiento(movimiento.value) : []));
const pesoTotal = computed(() => paquetes.value.reduce((s, p) => s + p.peso_c, 0));
const totalesPorTipo = computed(() =>
  tipos
    .map((tipo) => {
      const items = paquetes.value.filter((p) => p.tipo === tipo);
      const precio = movimiento.value?.precios[tipo];
      return {
        tipo,
        cantidad: items.length,
        peso: items.reduce((sum, p) => sum + p.peso_c, 0),
        valor:
          precio === undefined
            ? null
            : items.reduce((sum, p) => sum + costoPaquete(p.peso_c, precio), 0),
      };
    })
    .filter((total) => total.cantidad > 0),
);
const resultado = computed(() => ganancia(paquetes.value, data.value.movimientos, true));
const tipo = ref<TipoHuevo>('R');
const granja = ref('');
const prefijo = ref('');

const busy = ref(false);
const capturaError = ref('');
const accionError = ref('');
const mensaje = ref('');
const ultimo = ref('');
const ultimoId = ref('');
const exportando = ref(false);
const conCompra = computed(
  () => movimiento.value?.tipo === 'VENTA' && movimiento.value.tiene_pesos_compra,
);
const disponiblesBase = computed(() =>
  data.value.paquetes.filter(
    (p) =>
      p.estado === 'EN_CAMION' &&
      p.compra_mov_id &&
      data.value.movimientos.some((m) => m.id === p.compra_mov_id && m.estado === 'TERMINADO'),
  ),
);
const granjas = computed(() =>
  data.value.partes.filter(
    (g) =>
      disponiblesBase.value.some((p) => p.granja_id === g.id) ||
      paquetes.value.some((p) => p.granja_id === g.id),
  ),
);
watch(
  granjas,
  (gs) => {
    if (!gs.some((g) => g.id === granja.value)) granja.value = gs[0]?.id ?? '';
  },
  { immediate: true },
);
const disponibles = computed(() => {
  const grouped = new Map<number, { peso_c: number; cantidad: number }>();
  for (const p of disponiblesBase.value.filter(
    (p) =>
      p.tipo === tipo.value &&
      p.granja_id === granja.value &&
      formatPeso(p.peso_c).startsWith(prefijo.value),
  )) {
    const row = grouped.get(p.peso_c) ?? { peso_c: p.peso_c, cantidad: 0 };
    row.cantidad++;
    grouped.set(p.peso_c, row);
  }
  return [...grouped.values()].sort((a, b) => a.peso_c - b.peso_c).slice(0, 60);
});
const marcados = computed(() =>
  paquetes.value
    .filter((p) => p.estado === 'EN_VENTA')
    .sort((a, b) => a.orden_captura - b.orden_captura),
);
async function registrar(peso: number) {
  if (busy.value) return;
  busy.value = true;
  capturaError.value = '';
  mensaje.value = '';
  try {
    const outlier = esOutlier(peso, medianaPorTipo(paquetes.value, tipo.value));
    const result = conCompra.value
      ? await marcarPeso(props.id, tipo.value, granja.value, peso)
      : { paquete: await agregarPeso(props.id, tipo.value, peso), mensaje: '' };
    mensaje.value = outlier
      ? 'Peso alejado más del 30% de la mediana. Registrado: comprueba la etiqueta.'
      : result.mensaje;
    if (movimiento.value?.tipo === 'VENTA' && result.paquete.compra_mov_id) {
      const costo = data.value.movimientos.find((m) => m.id === result.paquete.compra_mov_id)
        ?.precios[tipo.value];
      const precio = movimiento.value.precios[tipo.value];
      if (
        costo !== undefined &&
        precio !== undefined &&
        costoPaquete(peso, precio) < costoPaquete(peso, costo)
      )
        mensaje.value += ' Aviso: se vende por debajo de su costo.';
    }
    ultimo.value = `Último: ${formatPeso(peso)} kg · ${nombres[tipo.value]}`;
    ultimoId.value = result.paquete.id;
    navigator.vibrate?.(30);
  } catch (err) {
    capturaError.value = err instanceof Error ? err.message : 'No se pudo registrar el peso.';
  } finally {
    busy.value = false;
  }
}
async function desmarcar(id: string) {
  if (busy.value) return;
  busy.value = true;
  try {
    await deshacerPeso(props.id, id);
    capturaError.value = '';
    mensaje.value = 'Peso desmarcado o retirado.';
    ultimo.value = '';
    ultimoId.value = '';
  } catch (err) {
    capturaError.value = err instanceof Error ? err.message : 'No se pudo deshacer.';
  } finally {
    busy.value = false;
  }
}
const filasDisponibles = computed(() =>
  Array.from({ length: Math.ceil(disponibles.value.length / 4) }, (_, i) =>
    disponibles.value.slice(i * 4, i * 4 + 4),
  ),
);
function deshacer() {
  const ultimo = (
    conCompra.value
      ? marcados.value
      : [...paquetes.value].sort((a, b) => a.orden_captura - b.orden_captura)
  ).at(-1);
  if (ultimo) void desmarcar(ultimo.id);
}
async function terminar() {
  busy.value = true;
  try {
    await terminarMovimiento(props.id);
    accionError.value = '';
  } catch (err) {
    accionError.value = err instanceof Error ? err.message : 'No se pudo terminar.';
  } finally {
    busy.value = false;
  }
}
function confirmarCancelacion() {
  if (busy.value) return;
  $q.dialog({
    title: 'Cancelar movimiento',
    message: 'Se desharán sus pesos y se liberarán los paquetes reservados. ¿Continuar?',
    ok: { label: 'Sí, cancelar movimiento' },
    cancel: { label: 'Seguir anotando', flat: true },
    persistent: true,
  }).onOk(() => {
    void cancelar();
  });
}
async function cancelar() {
  if (busy.value) return;
  const viajeId = movimiento.value?.viaje_id;
  busy.value = true;
  accionError.value = '';
  try {
    await cancelarMovimiento(props.id);
    await router.push({ path: '/viaje', query: viajeId ? { id: viajeId } : {} });
  } catch (err) {
    accionError.value = err instanceof Error ? err.message : 'No se pudo cancelar.';
  } finally {
    busy.value = false;
  }
}
function volver() {
  if (origenMovimientos.value) {
    void router.push(origenMovimientos.value);
    return;
  }
  void router.push({
    path: '/viaje',
    query: movimiento.value ? { id: movimiento.value.viaje_id } : {},
  });
}
async function exportar(formato: 'xlsx') {
  exportando.value = true;
  try {
    const { exportarMovimiento } = await import('@/services/exportaciones');
    await exportarMovimiento(props.id, formato);
  } catch (err) {
    accionError.value = err instanceof Error ? err.message : 'No se pudo exportar.';
  } finally {
    exportando.value = false;
  }
}
</script>
<style scoped>
.capture-page {
  background: var(--ksm-surface);
  color: var(--ksm-text);
  min-height: 100dvh;
  padding: max(4px, env(safe-area-inset-top)) 12px 0;
}
.capture-content {
  max-width: 480px;
  margin: auto;
  padding-bottom: calc(160px + env(safe-area-inset-bottom));
}
.capture-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 48px;
  margin-bottom: 8px;
}
.capture-context {
  min-width: 0;
  flex: 1;
}
.capture-context small {
  display: block;
  color: var(--ksm-muted);
  font-size: 14px;
  line-height: 20px;
}
.capture-context h1 {
  margin: 0;
  font-size: 20px;
  line-height: 24px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.capture-brand {
  font-size: 14px;
  color: var(--ksm-muted);
}
.capture-panel {
  margin-bottom: 12px;
}
.capture-panel h2 {
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
  margin: 0;
}
.movement-heading-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.movement-symbol {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--ksm-radius-control);
  flex-shrink: 0;
  color: var(--ksm-primary);
  background: var(--ksm-soft);
}
.movement-symbol.venta {
  color: var(--ksm-positive);
  background: var(--ksm-positive-bg);
}
.movement-symbol.flete {
  color: var(--ksm-warning);
  background: var(--ksm-warning-bg);
}
.movement-title {
  min-width: 0;
  flex: 1;
}
.movement-eyebrow {
  display: block;
  font-size: 14px;
  color: var(--ksm-muted);
  font-weight: 600;
}
.movement-title h1 {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  margin: 0;
  overflow-wrap: anywhere;
}
.movement-state {
  white-space: nowrap;
  padding: 4px 8px;
  color: var(--ksm-positive);
  background: var(--ksm-positive-bg);
  border-radius: var(--ksm-radius-control);
  font-size: 14px;
  font-weight: 600;
}
.movement-state.done {
  color: var(--ksm-muted);
  background: var(--ksm-soft);
}
.movement-date {
  font-size: 14px;
  color: var(--ksm-muted);
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
}
.type-R {
  color: var(--egg-r);
  background: var(--egg-r-bg);
}
.type-P {
  color: var(--egg-p);
  background: var(--egg-p-bg);
}
.type-J {
  color: var(--egg-j);
  background: var(--egg-j-bg);
}
.section-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.section-heading > span {
  font-size: 14px;
  color: var(--ksm-muted);
}
.capture-hint {
  font-size: 14px;
  color: var(--ksm-muted);
  line-height: 20px;
  margin: 8px 0;
}
.farm-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.farm-panel h2 {
  flex-shrink: 0;
  max-width: 64px;
  font-size: 14px;
  line-height: 20px;
  color: var(--ksm-muted);
}
.disponibles {
  max-height: 216px;
}
.marked-weights strong {
  display: block;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.marked-weights span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  gap: 8px;
}
.weights-panel,
.document-panel {
  margin-top: 12px;
}
.weights-grand-total,
.movement-amount,
.freight-line {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.weights-grand-total {
  border-top: 2px solid var(--ksm-border);
  padding-top: 8px;
  font-size: 16px;
  font-weight: 600;
}
.movement-type-totals {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.movement-type-totals caption {
  text-align: left;
  font-size: 16px;
  font-weight: 700;
  padding: 8px 0;
}
.movement-type-totals th,
.movement-type-totals td {
  padding: 8px 4px;
  border-bottom: 1px solid var(--ksm-border);
  text-align: right;
  overflow-wrap: anywhere;
}
.movement-type-totals th:first-child {
  text-align: left;
}
.movement-type-totals thead th {
  color: var(--ksm-muted);
}
.weights-grand-total strong {
  font-size: 24px;
  font-variant-numeric: tabular-nums;
}
.weights-grand-total small {
  font-size: 16px;
  font-weight: 400;
}
.movement-amount {
  font-size: 16px;
  margin-top: 8px;
  color: var(--ksm-muted);
}
.movement-amount strong {
  color: var(--ksm-text);
  font-variant-numeric: tabular-nums;
}
.footer-totals {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}
.footer-totals > strong {
  margin: 0;
  color: var(--ksm-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}
.footer-totals > strong span {
  color: var(--ksm-muted);
  font-weight: 400;
}
.footer-totals > span {
  font-size: 14px;
  color: var(--ksm-muted);
  line-height: 20px;
}
.footer-gain {
  display: block;
  color: var(--ksm-muted);
  font-size: 14px;
}
.capture-error {
  background: var(--ksm-negative-bg);
  color: var(--ksm-negative);
  border-radius: var(--ksm-radius-control);
  font-size: 16px;
}
.capture-note {
  font-size: 16px;
  background: var(--ksm-warning-bg);
  color: var(--ksm-warning);
  padding: 12px;
  border-radius: var(--ksm-radius-control);
  margin-bottom: 12px;
}
.empty-weights,
.capture-loading {
  font-size: 16px;
  color: var(--ksm-muted);
  padding: 16px 0;
  line-height: 24px;
}
.type-counts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  color: var(--ksm-muted);
}
</style>

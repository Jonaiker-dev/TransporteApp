<template>
  <AppButton icon="picture_as_pdf" label="Ver PDF" @click="abrir" variant="primary" size="md" />
  <q-dialog v-model="dialogo" :maximized="$q.screen.lt.sm" @hide="limpiar">
    <AppCard role="region" aria-label="Vista previa PDF" class="pdf-dialog" padding="none">
      <header class="pdf-header">
        <div>
          <span class="pdf-eyebrow">COMPROBANTE</span>
          <h2>Vista previa PDF</h2>
        </div>
        <AppButton
          icon="close"
          aria-label="Cerrar vista previa PDF"
          v-close-popup
          variant="ghost"
          size="md"
          icon-only
        />
      </header>
      <AppButtonRow class="pdf-toolbar" label="Acciones">
        <AppButton
          icon="download"
          label="Descargar PDF"
          :disabled="!archivo"
          @click="descargar"
          variant="primary"
          size="md"
        /><CompartirPdf
          :id="id"
          :por-viaje="porViaje"
          :archivo="archivo"
          :disabled="!archivo"
        /><AppButton
          v-if="url"
          :href="url"
          target="_blank"
          rel="noopener"
          variant="secondary"
          label="Abrir pestaña"
          icon="open_in_new"
        />
      </AppButtonRow>
      <div v-if="busy" class="pdf-loading" role="status">
        <q-spinner color="primary" size="32px" /><span>Preparando tu documento…</span>
      </div>
      <div v-if="error" class="pdf-error" role="alert">
        {{ error }}<span v-if="archivo"> Puedes descargar el PDF o abrirlo en otra pestaña.</span>
      </div>
      <div ref="host" class="pdf-paper-area" :class="{ 'is-loading': busy }">
        <canvas ref="canvas" role="img" :aria-label="`Página ${pagina} del comprobante PDF`" />
      </div>
      <footer v-if="paginas" class="pdf-pages">
        <AppButtonRow label="Paginacion"
          ><AppButton
            icon="chevron_left"
            aria-label="Página anterior"
            :disabled="pagina <= 1 || dibujando"
            @click="cambiarPagina(-1)"
            variant="ghost"
            size="md"
            icon-only /><AppButton
            icon="chevron_right"
            aria-label="Página siguiente"
            :disabled="pagina >= paginas || dibujando"
            @click="cambiarPagina(1)"
            variant="ghost"
            size="md"
            icon-only
        /></AppButtonRow>
        <div class="pdf-page-options">
          <span
            >Página <strong>{{ pagina }}</strong> de {{ paginas }}</span
          >
          <select v-model.number="zoom" aria-label="Zoom del PDF" @change="dibujar">
            <option :value="1">100%</option>
            <option :value="1.5">150%</option>
            <option :value="2">200%</option>
          </select>
        </div>
      </footer>
    </AppCard>
  </q-dialog>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import CompartirPdf from './CompartirPdf.vue';
import { nextTick, onBeforeUnmount, ref, shallowRef } from 'vue';
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { prepararPDF, descargarArchivo } from '../services/exportaciones';
const props = defineProps<{ id: string; porViaje?: boolean }>();
const dialogo = ref(false);
const busy = ref(false);
const error = ref('');
const pagina = ref(1);
const paginas = ref(0);
const dibujando = ref(false);
const zoom = ref(1);
const canvas = ref<HTMLCanvasElement | null>(null);
const host = ref<HTMLElement | null>(null);
const archivo = shallowRef<{ blob: Blob; nombre: string } | null>(null);
const url = ref('');
let pdf: PDFDocumentProxy | null = null;
let carga: PDFDocumentLoadingTask | null = null;
let render: RenderTask | null = null;
let observer: ResizeObserver | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let version = 0;
let dibujoVersion = 0;
async function abrir() {
  limpiar();
  dialogo.value = true;
  busy.value = true;
  error.value = '';
  pagina.value = 1;
  zoom.value = 1;
  const actual = version;
  try {
    const result = await prepararPDF(props.id, props.porViaje);
    if (actual !== version || !dialogo.value) return;
    archivo.value = result;
    url.value = URL.createObjectURL(result.blob);
    const pdfjs = await import('pdfjs-dist');
    if (actual !== version || !dialogo.value) return;
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const tarea = pdfjs.getDocument({ data: new Uint8Array(await result.blob.arrayBuffer()) });
    carga = tarea;
    const document = await tarea.promise;
    if (actual !== version || !dialogo.value) {
      void tarea.destroy();
      return;
    }
    pdf = document;
    paginas.value = pdf.numPages;
    busy.value = false;
    await nextTick();
    await dibujar();
    if (host.value && actual === version) {
      observer = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          void dibujar();
        }, 120);
      });
      observer.observe(host.value);
    }
  } catch (err) {
    if (actual === version)
      error.value = err instanceof Error ? err.message : 'No se pudo mostrar la vista previa.';
  } finally {
    if (actual === version) busy.value = false;
  }
}
async function dibujar() {
  const doc = pdf;
  const target = canvas.value;
  const container = host.value;
  if (!doc || !target || !container || !dialogo.value) return;
  const actual = ++dibujoVersion;
  dibujando.value = true;
  const anterior = render;
  if (anterior) {
    anterior.cancel();
    await anterior.promise.catch(() => undefined);
  }
  try {
    const page = await doc.getPage(pagina.value);
    if (actual !== dibujoVersion || !dialogo.value) return;
    const base = page.getViewport({ scale: 1 });
    const width = Math.max(200, Math.min(760, container.clientWidth - 32));
    const viewport = page.getViewport({ scale: (width / base.width) * zoom.value });
    const density = Math.min(2, window.devicePixelRatio || 1);
    target.width = Math.ceil(viewport.width * density);
    target.height = Math.ceil(viewport.height * density);
    target.style.width = `${viewport.width}px`;
    target.style.height = `${viewport.height}px`;
    render = page.render({ canvas: target, viewport, transform: [density, 0, 0, density, 0, 0] });
    await render.promise;
  } catch (err) {
    if (actual === dibujoVersion && dialogo.value)
      error.value = err instanceof Error ? err.message : 'No se pudo dibujar esta página.';
  } finally {
    if (actual === dibujoVersion) {
      dibujando.value = false;
      render = null;
    }
  }
}
function cambiarPagina(delta: number) {
  if (dibujando.value) return;
  pagina.value += delta;
  void dibujar();
}
async function descargar() {
  if (archivo.value) await descargarArchivo(archivo.value.blob, archivo.value.nombre);
}
function limpiar() {
  version++;
  dibujoVersion++;
  observer?.disconnect();
  observer = null;
  clearTimeout(resizeTimer);
  render?.cancel();
  render = null;
  if (carga) void carga.destroy().catch(() => undefined);
  carga = null;
  pdf = null;
  paginas.value = 0;
  dibujando.value = false;
  archivo.value = null;
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = '';
  if (canvas.value) {
    canvas.value.width = 0;
    canvas.value.height = 0;
  }
}
onBeforeUnmount(limpiar);
</script>
<style scoped>
.pdf-dialog {
  display: flex;
  flex-direction: column;
  width: 900px;
  max-width: calc(100vw - 32px);
  height: 90dvh;
  overflow: hidden;
}
.pdf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--ksm-border, #e2e8f0);
  flex-shrink: 0;
}
.pdf-header h2 {
  font-size: 18px;
  line-height: 1.4;
  margin: 3px 0 0;
  font-weight: 700;
}
.pdf-eyebrow {
  font-size: 9px;
  letter-spacing: 0.1em;
  color: var(--ksm-muted);
  font-weight: 650;
}
.open-pdf {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1765b0;
  font-size: 11px;
}
.pdf-loading {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  font-size: 13px;
  color: var(--ksm-muted);
}
.pdf-error {
  margin: 0 16px 12px;
  font-size: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #fff1f2;
  color: #b42332;
  line-height: 1.5;
}
.pdf-paper-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #e6ebf2;
  padding: 16px;
  text-align: center;
}
.pdf-paper-area.is-loading {
  visibility: hidden;
}
.pdf-paper-area canvas {
  display: block;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 2px 14px rgba(15, 23, 42, 0.1);
}
.pdf-pages select {
  min-height: 36px;
  border: 1px solid var(--ksm-border);
  border-radius: 8px;
  padding: 0 7px;
  background: var(--ksm-card, #fff);
  color: inherit;
  font: inherit;
}
:global(.body--dark .pdf-paper-area) {
  background: #111b2b;
}
:global(.body--dark .open-pdf) {
  color: #93c5fd;
}
@media (max-width: 599px) {
  .pdf-dialog {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
  }
}
.pdf-pages {
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--ksm-border);
}
.pdf-page-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
</style>

<template>
  <AppButtonRow class="backup-row q-mb-md" label="Acciones" layout="primary-first">
    <AppButton
      type="button"
      :class="{ pending: pendientes > 0 }"
      @click="detalles = true"
      variant="secondary"
      size="md"
    >
      <q-icon
        :name="syncState.running ? 'sync' : pendientes ? 'cloud_upload' : 'check_circle_outline'"
        size="16px"
      /><span>{{
        syncState.running
          ? 'Respaldando…'
          : pendientes
            ? `${pendientes} sin respaldar`
            : syncState.configured
              ? 'Todo respaldado'
              : 'Guardado en este dispositivo'
      }}</span
      ><q-icon name="chevron_right" size="14px" />
    </AppButton>
    <AppButton
      icon="dark_mode"
      aria-label="Cambiar tema claro u oscuro"
      @click="tema"
      variant="ghost"
      size="md"
      class="ksm-touch"
      icon-only
    />
    <q-dialog v-model="detalles"
      ><AppCard class="backup-dialog"
        ><div class="row items-center justify-between">
          <h2>Respaldo de tus datos</h2>
          <AppButton
            icon="close"
            aria-label="Cerrar estado de respaldo"
            v-close-popup
            variant="ghost"
            size="md"
            icon-only
          />
        </div>
        <p>
          {{
            syncState.error ||
            (pendientes
              ? `${pendientes} cambios pendientes de respaldar.`
              : 'No tienes cambios pendientes de respaldo.')
          }}
        </p>
        <AppButton
          v-if="syncState.configured && syncState.authenticated"
          label="Respaldar ahora"
          :loading="syncState.running"
          @click="sincronizar"
          variant="primary"
          size="md"
        /><AppButton v-else label="Conectar respaldo" to="/login" variant="primary" size="md" />
        <p v-if="!instalada" class="install-help">
          Para tener la app a mano, instálala desde el menú del navegador. En iPhone: Compartir →
          Añadir a pantalla de inicio.
        </p></AppCard
      ></q-dialog
    >
  </AppButtonRow>
</template>
<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { syncState, sincronizar } from '../sync/supabase';
defineProps<{ pendientes: number }>();
const $q = useQuasar();
const detalles = ref(false);
const instalada = window.matchMedia('(display-mode: standalone)').matches;
function tema() {
  $q.dark.toggle();
  localStorage.setItem('ksm-dark', String($q.dark.isActive));
}
</script>
<style scoped>
.backup-dialog {
  max-width: 420px;
  width: calc(100vw - 32px);
}
.backup-dialog h2 {
  font-size: 17px;
  margin: 0;
  font-weight: 700;
}
.backup-dialog p {
  font-size: 16px;
  line-height: 1.7;
  color: var(--ksm-muted);
  margin: 14px 0;
}
.backup-dialog .install-help {
  border-top: 1px solid var(--ksm-border);
  padding-top: 14px;
  font-size: 14px;
}
</style>

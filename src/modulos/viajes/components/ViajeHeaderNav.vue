<template>
  <div class="viaje-header-nav q-mb-md">
    <!-- Fila superior: Ruta y Badge 'Todo respaldado' -->
    <div class="route-status-row row items-center justify-between q-mb-xs">
      <div class="row items-center no-wrap route-title-group">
        <span class="route-city text-weight-bolder">Chincha</span>
        <q-icon name="arrow_forward" size="20px" class="route-arrow q-mx-xs" />
        <span class="route-city text-weight-bolder">Lima</span>
      </div>

      <!-- Badge 'Todo respaldado' según la imagen -->
      <AppButton
        icon="cloud_upload"
        :label="data.pendientes ? `${data.pendientes} pendientes` : 'Todo respaldado'"
        @click="sincronizar"
        variant="ghost"
        size="md"
      />
    </div>

    <!-- Enlace de regreso (← Inicio o ← Cancelar) -->
    <div>
      <router-link :to="backTo" class="back-link row items-center inline">
        <q-icon name="arrow_back" size="15px" class="q-mr-xs" />
        <span>{{ backText }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { useTransporte } from '@/composables/useTransporte';
import { sincronizar } from '@/sync/supabase';
const { data } = useTransporte();
withDefaults(
  defineProps<{
    backTo?: string;
    backText?: string;
  }>(),
  {
    backTo: '/',
    backText: 'Inicio',
  },
);
</script>

<style scoped>
.route-status-row {
  gap: 8px;
}
.route-city {
  font-size: 1.45rem;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.route-arrow {
  color: #00bcd4;
}

.back-link {
  color: #64748b;
  text-decoration: underline;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #1976d2;
}
</style>

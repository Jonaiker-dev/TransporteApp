<template>
  <div class="auth-card-wrapper">
    <AppCard class="auth-card">
      <!-- Barra decorativa cyan en la esquina superior -->

      <!-- Encabezado de la tarjeta -->
      <div class="card-header q-mt-sm q-mb-lg">
        <h1 class="card-title text-weight-bolder text-grey-10 q-my-none">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="card-subtitle text-grey-7 q-mt-xs q-mb-none">
          {{ subtitle }}
        </p>
      </div>

      <!-- Contenido / Formulario -->
      <div class="card-body">
        <slot />
      </div>

      <!-- Pie de la tarjeta -->
      <div v-if="$slots.footer" class="card-footer q-mt-md text-center">
        <slot name="footer" />
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue';
defineProps<{
  title: string;
  subtitle?: string | undefined;
}>();
</script>

<style scoped>
.auth-card-wrapper {
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
}

.auth-card {
  position: relative;
}

.card-title {
  font-size: 1.7rem;
  line-height: 1.2;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.card-subtitle {
  font-size: 0.92rem;
  color: #64748b;
  font-weight: 400;
}

.card-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

@media (max-width: 480px) {
  .card-title {
    font-size: 1.5rem;
  }
}
</style>

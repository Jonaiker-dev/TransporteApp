<template>
  <div class="resultado q-mt-sm">
    <div class="text-caption">
      {{
        resultado.ganancia < 0
          ? 'Pérdida bruta realizada'
          : resultado.ganancia > 0
            ? 'Ganancia bruta realizada'
            : 'Sin variación realizada'
      }}
    </div>
    <strong :class="resultado.ganancia < 0 ? 'text-negative' : 'text-positive'">
      {{ resultado.ganancia >= 0 ? '+' : '−' }}{{ soles(Math.abs(resultado.ganancia)) }}
      <span v-if="resultado.porcentaje !== null"> · {{ resultado.porcentaje.toFixed(1) }}%</span>
    </strong>
    <div v-if="resultado.excluidos" class="text-caption text-orange-9">
      {{ resultado.excluidos }} paq. sin precio o costo no entran en la ganancia.
    </div>
  </div>
</template>
<script setup lang="ts">
import { soles, type ganancia } from '../domain/ganancia';
defineProps<{ resultado: ReturnType<typeof ganancia> }>();
</script>

<style scoped>
.resultado {
  font-size: 16px;
}
.resultado .text-caption {
  font-size: 14px;
  line-height: 20px;
}
.resultado > strong {
  display: block;
  font-size: 24px;
  line-height: 32px;
  font-variant-numeric: tabular-nums;
}
</style>

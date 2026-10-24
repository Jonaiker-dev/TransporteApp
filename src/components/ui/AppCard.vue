<template>
  <q-card
    class="app-card"
    :class="{ 'app-card--flush': padding === 'none' }"
    :tag="tag"
    flat
    bordered
    ><slot
  /></q-card>
</template>
<script setup lang="ts">
import { QCard } from 'quasar';
withDefaults(defineProps<{ padding?: 'md' | 'none'; tag?: string }>(), {
  padding: 'md',
  tag: 'div',
});
</script>
<style scoped lang="scss">
.q-card.app-card {
  padding: $app-card-padding;
  border: $app-card-border-width solid var(--ksm-border);
  border-radius: $app-card-radius;
  background: var(--ksm-card);
  color: var(--ksm-text);
  box-shadow: none;
  backdrop-filter: none;
}
.q-card.app-card--flush {
  padding: 0;
}
</style>

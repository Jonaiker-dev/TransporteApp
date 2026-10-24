<template>
  <router-view />
</template>
<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { iniciarRespaldo, sincronizar, syncState } from './sync/supabase';
import { useTransporte } from './composables/useTransporte';
import { useAuthStore } from './stores/auth';
const $q = useQuasar();
const { data } = useTransporte();
const auth = useAuthStore();
let debounce: ReturnType<typeof setTimeout> | undefined;
watch(
  () => data.value.pendientes,
  (count, previous) => {
    if (count > previous && syncState.configured) {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        void sincronizar();
      }, 1500);
    }
  },
);
onMounted(() => {
  $q.dark.set(localStorage.getItem('ksm-dark') === 'true');
  void iniciarRespaldo();
  void auth.init();
  void navigator.storage?.persist?.().catch(() => false);
});
</script>

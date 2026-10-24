import { onMounted, onUnmounted, ref } from 'vue';

export function useNetworkStatus() {
  const isOnline = ref(typeof navigator === 'undefined' || navigator.onLine);

  function updateNetworkStatus() {
    isOnline.value = navigator.onLine;
  }

  onMounted(() => {
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  });

  return { isOnline };
}

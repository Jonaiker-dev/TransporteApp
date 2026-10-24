import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import type { LoginCredentials } from '../types';

export function useLogin() {
  const router = useRouter();
  const route = useRoute();
  const $q = useQuasar();
  const authStore = useAuthStore();
  const { isLoading } = storeToRefs(authStore);

  const form = reactive<LoginCredentials>({
    email: '',
    password: '',
    recordarme: true,
  });

  const showPassword = ref(false);
  const errorMessage = ref('');

  function toggleShowPassword() {
    showPassword.value = !showPassword.value;
  }

  function validate(): boolean {
    errorMessage.value = '';
    const email = form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errorMessage.value = 'Por favor, ingresa tu correo electrónico.';
      return false;
    }

    if (!emailRegex.test(email)) {
      errorMessage.value = 'Por favor, ingresa un correo electrónico válido.';
      return false;
    }

    if (!form.password) {
      errorMessage.value = 'Por favor, ingresa tu contraseña.';
      return false;
    }

    return true;
  }

  async function submitLogin() {
    if (!validate()) {
      $q.notify({
        type: 'negative',
        message: errorMessage.value,
        position: 'top',
        timeout: 3000,
      });
      return false;
    }

    const response = await authStore.login(form);

    if (response.success && response.user) {
      $q.notify({
        type: 'positive',
        message: `¡Bienvenido de nuevo, ${response.user.nombre}!`,
        icon: 'check_circle',
        position: 'top',
        timeout: 2500,
      });

      const redirectPath = (route.query.redirect as string) || '/';
      await router.push(redirectPath);
      return true;
    } else {
      errorMessage.value = response.message;
      $q.notify({
        type: 'negative',
        message: response.message,
        icon: 'error_outline',
        position: 'top',
        timeout: 3500,
      });
      return false;
    }
  }

  return {
    form,
    showPassword,
    errorMessage,
    isLoading,
    toggleShowPassword,
    submitLogin,
  };
}

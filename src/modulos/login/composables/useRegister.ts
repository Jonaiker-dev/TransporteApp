import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '../types';

export interface RegisterFormData {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono: string;
  rol: UserRole;
}

export function useRegister() {
  const router = useRouter();
  const $q = useQuasar();
  const authStore = useAuthStore();
  const { isLoading } = storeToRefs(authStore);

  const form = reactive<RegisterFormData>({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    rol: 'conductor',
  });

  const showPassword = ref(false);
  const showConfirmPassword = ref(false);
  const errorMessage = ref('');

  function toggleShowPassword() {
    showPassword.value = !showPassword.value;
  }

  function toggleShowConfirmPassword() {
    showConfirmPassword.value = !showConfirmPassword.value;
  }

  function validate(): boolean {
    errorMessage.value = '';
    const nombre = form.nombre.trim();
    const email = form.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombre) {
      errorMessage.value = 'Por favor, ingresa tu nombre completo.';
      return false;
    }

    if (!email) {
      errorMessage.value = 'Por favor, ingresa tu correo electrónico.';
      return false;
    }

    if (!emailRegex.test(email)) {
      errorMessage.value = 'Por favor, ingresa un formato de correo válido.';
      return false;
    }

    if (!form.password) {
      errorMessage.value = 'Por favor, ingresa una contraseña.';
      return false;
    }

    if (form.password.length < 6) {
      errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
      return false;
    }

    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'Las contraseñas no coinciden.';
      return false;
    }

    return true;
  }

  async function submitRegister() {
    if (!validate()) {
      $q.notify({
        type: 'negative',
        message: errorMessage.value,
        position: 'top',
        timeout: 3000,
      });
      return false;
    }

    const response = await authStore.register(form);

    if (response.success && response.user) {
      $q.notify({
        type: 'positive',
        message: `¡Registro exitoso! Bienvenido a Transportes K.S.M, ${response.user.nombre}.`,
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });

      await router.push('/');
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
    showConfirmPassword,
    errorMessage,
    isLoading,
    toggleShowPassword,
    toggleShowConfirmPassword,
    submitRegister,
  };
}

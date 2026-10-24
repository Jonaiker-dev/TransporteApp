<template>
  <div class="auth-page-container flex column no-wrap justify-between">
    <!-- Capa de fondo con imagen cinemática de carretera y gradiente azul oscuro -->
    <div class="background-backdrop" />

    <!-- Encabezado corporativo: Isotipo camión y Transportes K.S.M -->
    <header class="auth-top-section q-pt-md">
      <AuthHeader />
    </header>

    <!-- Tarjeta flotante principal centrada/inferior estilo móvil/responsive -->
    <main class="auth-main-section flex flex-center q-pb-xl">
      <AuthCard title="Inicia sesión" subtitle="Ingresa tus datos para continuar.">
        <form @submit.prevent="handleLoginSubmit">
          <div v-if="errorMessage" role="alert" class="text-negative q-mb-md">
            {{ errorMessage }}
          </div>
          <!-- Campo Correo Electrónico -->
          <AuthInput
            v-model="form.email"
            label="Correo electrónico"
            placeholder="nombre@empresa.com"
            type="email"
            icon="mail_outline"
            autocomplete="email"
            class="q-mb-md"
          />

          <!-- Campo Contraseña -->
          <AuthInput
            v-model="form.password"
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            icon="lock_outline"
            :is-password="true"
            autocomplete="current-password"
            class="q-mb-lg"
          />

          <!-- Botón de acción: Entrar con flecha -->
          <AppButton
            type="submit"
            :disabled="isLoading"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            label="Entrar"
          ></AppButton>
        </form>

        <div class="text-center q-mt-md">
          <AppButton label="Continuar sin sesión" to="/" variant="ghost" size="md" />
          <div class="text-caption text-grey-7">
            La sesión sirve para respaldar; puedes trabajar sin conexión.
          </div>
        </div>
        <!-- Enlace a registro -->
        <template #footer>
          <div class="row items-center justify-center text-body2 text-grey-8">
            <span>¿No tienes una cuenta?</span>
            <router-link to="/registro" class="register-link q-ml-xs text-primary text-weight-bold">
              Regístrate aquí
            </router-link>
          </div>
        </template>
      </AuthCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AuthHeader from '../components/AuthHeader.vue';
import AuthCard from '../components/AuthCard.vue';
import AuthInput from '../components/AuthInput.vue';
import { useLogin } from '../composables/useLogin';

const { form, isLoading, errorMessage, submitLogin } = useLogin();

async function handleLoginSubmit() {
  await submitLogin();
}
</script>

<style scoped>
.auth-page-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #0b1329;
}

.background-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(180deg, rgba(11, 23, 44, 0.4) 0%, rgba(10, 20, 36, 0.75) 100%),
    url('/images/login-bg.jpg');
  background-size: cover;
  background-position: center bottom;
  background-repeat: no-repeat;
}

.auth-top-section {
  position: relative;
  z-index: 2;
  width: 100%;
}

.auth-main-section {
  position: relative;
  z-index: 2;
  width: 100%;
  flex: 1;
}

.register-link {
  text-decoration: none;
  transition: opacity 0.2s;
}

.register-link:hover {
  text-decoration: underline;
}

.demo-account-hint {
  opacity: 0.85;
}
</style>

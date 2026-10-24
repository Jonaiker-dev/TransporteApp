<template>
  <div class="auth-page-container flex column no-wrap justify-between">
    <!-- Capa de fondo con imagen cinemática de carretera y gradiente azul oscuro -->
    <div class="background-backdrop" />

    <!-- Encabezado corporativo: Isotipo camión y Transportes K.S.M -->
    <header class="auth-top-section q-pt-md">
      <AuthHeader />
    </header>

    <!-- Tarjeta flotante principal para el registro -->
    <main class="auth-main-section flex flex-center q-pb-xl">
      <AuthCard title="Crear cuenta" subtitle="Registra tus datos para comenzar.">
        <form @submit.prevent="handleRegisterSubmit">
          <div v-if="errorMessage" role="alert" class="text-negative q-mb-md">
            {{ errorMessage }}
          </div>
          <!-- Campo Nombre Completo -->
          <AuthInput
            v-model="form.nombre"
            label="Nombre completo"
            placeholder="Ej. Juan Pérez"
            type="text"
            icon="person_outline"
            autocomplete="name"
            class="q-mb-sm"
          />

          <!-- Campo Correo Electrónico -->
          <AuthInput
            v-model="form.email"
            label="Correo electrónico"
            placeholder="nombre@empresa.com"
            type="email"
            icon="mail_outline"
            autocomplete="email"
            class="q-mb-sm"
          />

          <!-- Campo Teléfono -->
          <AuthInput
            v-model="form.telefono"
            label="Teléfono / Celular (Opcional)"
            placeholder="+51 987 654 321"
            type="tel"
            icon="phone"
            autocomplete="tel"
            class="q-mb-sm"
          />

          <!-- Campo Contraseña -->
          <AuthInput
            v-model="form.password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            icon="lock_outline"
            :is-password="true"
            autocomplete="new-password"
            class="q-mb-sm"
          />

          <!-- Campo Confirmar Contraseña -->
          <AuthInput
            v-model="form.confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            icon="lock_outline"
            :is-password="true"
            autocomplete="new-password"
            class="q-mb-lg"
          />

          <!-- Botón de Registro -->
          <AppButton
            type="submit"
            :disabled="isLoading"
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            label="Registrarse"
          ></AppButton>
        </form>

        <!-- Enlace para volver al login -->
        <template #footer>
          <div class="row items-center justify-center text-body2 text-grey-8">
            <span>¿Ya tienes una cuenta?</span>
            <router-link to="/login" class="login-link q-ml-xs text-primary text-weight-bold">
              Inicia sesión aquí
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
import { useRegister } from '../composables/useRegister';

const { form, isLoading, errorMessage, submitRegister } = useRegister();

async function handleRegisterSubmit() {
  await submitRegister();
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

.login-link {
  text-decoration: none;
  transition: opacity 0.2s;
}

.login-link:hover {
  text-decoration: underline;
}
</style>

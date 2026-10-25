<template>
  <q-layout view="lHh Lpr lFf" class="bg-surface">
    <!-- Header superior según el diseño -->
    <q-header v-if="!isFullScreenDetail" class="app-top-header text-grey-9 q-py-xs">
      <q-toolbar class="q-px-md row items-center justify-between">
        <!-- Izquierda: Logo y Nombre de la Empresa -->
        <div class="row items-center no-wrap cursor-pointer" @click="goToHome">
          <div class="header-logo-box flex flex-center shadow-1">
            <q-icon name="local_shipping" size="22px" color="white" />
          </div>
          <span class="header-brand-title q-ml-sm text-weight-bold"> Transportes K.S.M </span>
        </div>

        <!-- Derecha: Notificaciones y Perfil -->
        <div class="row items-center q-gutter-x-sm">
          <!-- Botón de alertas / campana con punto rojo según la imagen -->
          <AppButton
            type="button"
            aria-label="Ver alertas y notificaciones"
            @click="openAlerts"
            variant="ghost"
            size="md"
            class="flex flex-center"
            icon-only
          >
            <q-icon name="notifications_none" size="22px" color="grey-8" />
            <span class="bell-red-badge" />
          </AppButton>

          <!-- Chip de estado de red (Desktop) -->
          <q-chip
            v-if="!$q.screen.lt.md && !isFullScreenDetail"
            dense
            :color="isOnline ? 'positive' : 'warning'"
            text-color="white"
            icon="cloud"
            class="q-ml-xs text-caption"
          >
            {{ isOnline ? 'Online' : 'Offline' }}
          </q-chip>

          <!-- Chip de usuario logueado en Desktop -->
          <template v-if="!$q.screen.lt.md && authStore.isAuthenticated">
            <q-chip
              clickable
              color="blue-1"
              text-color="primary"
              icon="account_circle"
              class="text-weight-medium"
              @click="openProfile"
            >
              {{ authStore.userName }}
            </q-chip>
          </template>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Barra lateral (DRAWER) - EXCLUSIVA PARA VISTA WEB / ESCRITORIO -->
    <!-- En vista mobile está totalmente eliminada según la solicitud -->
    <q-drawer
      v-if="!$q.screen.lt.md"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="270"
      class="bg-white sidebar-drawer"
    >
      <div class="sidebar-container column justify-between full-height q-pa-md">
        <div>
          <!-- Cabecera de la barra lateral -->
          <div class="row items-center q-mb-lg q-pt-sm">
            <div class="header-logo-box flex flex-center shadow-1">
              <q-icon name="local_shipping" size="22px" color="white" />
            </div>
            <div class="q-ml-sm">
              <div class="text-weight-bold text-subtitle1 leading-tight">Transportes K.S.M</div>
              <div class="text-caption text-grey-6">Panel de Control</div>
            </div>
          </div>

          <!-- Perfil resumido de Pinia -->
          <AppCard class="user-card-sidebar q-mb-lg">
            <div class="row items-center no-wrap">
              <q-avatar size="38px" color="primary" text-color="white" icon="person" />
              <div class="q-ml-sm ellipsis">
                <div class="text-weight-bold text-body2 ellipsis">
                  {{ authStore.isAuthenticated ? authStore.userName : 'Invitado' }}
                </div>
                <div class="text-caption text-grey-7 ellipsis">
                  {{ authStore.isAuthenticated ? authStore.userRole : 'Sin iniciar sesión' }}
                </div>
              </div>
            </div>
          </AppCard>

          <!-- Opciones de Navegación Lateral (Espejo de la cinta inferior móvil) -->
          <div class="text-caption text-weight-bold text-grey-6 q-mb-xs q-px-sm">
            NAVEGACIÓN PRINCIPAL
          </div>

          <q-list class="sidebar-nav-list">
            <!-- 1. Inicio -->
            <q-item
              clickable
              v-ripple
              to="/"
              exact
              active-class="sidebar-item-active"
              class="sidebar-item q-mb-xs"
            >
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Inicio</q-item-label>
                <q-item-label caption>Ruta principal</q-item-label>
              </q-item-section>
            </q-item>

            <!-- 1.1 Viaje en curso -->
            <q-item
              clickable
              v-ripple
              to="/viaje"
              active-class="sidebar-item-active"
              class="sidebar-item q-mb-xs"
            >
              <q-item-section avatar>
                <q-icon name="local_shipping" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Continuar Viaje</q-item-label>
                <q-item-label caption>Movimientos y hoja</q-item-label>
              </q-item-section>
            </q-item>

            <!-- 1.2 Compra -->
            <q-item
              clickable
              v-ripple
              to="/viaje/compra"
              active-class="sidebar-item-active"
              class="sidebar-item q-mb-xs"
            >
              <q-item-section avatar>
                <q-icon name="add_shopping_cart" color="teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Compra en Granja</q-item-label>
                <q-item-label caption>Acopio y precios</q-item-label>
              </q-item-section>
            </q-item>

            <!-- 1.3 Venta -->
            <q-item
              clickable
              v-ripple
              to="/viaje/venta"
              active-class="sidebar-item-active"
              class="sidebar-item q-mb-xs"
            >
              <q-item-section avatar>
                <q-icon name="point_of_sale" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Venta en Lima</q-item-label>
                <q-item-label caption>Clientes y distribución</q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/viaje/flete"
              active-class="sidebar-item-active"
              class="sidebar-item q-mb-xs"
            >
              <q-item-section avatar>
                <q-icon name="local_shipping" color="orange-9" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Flete</q-item-label>
                <q-item-label caption>Paquetes por tipo de huevo</q-item-label>
              </q-item-section>
            </q-item>

            <!-- 2. Módulos -->
            <q-item clickable v-ripple class="sidebar-item q-mb-xs" @click="openModules">
              <q-item-section avatar>
                <q-icon name="grid_view" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Todos los Módulos</q-item-label>
                <q-item-label caption>Accesos y operaciones</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="primary" label="5" />
              </q-item-section>
            </q-item>

            <!-- 3. Alertas -->
            <q-item clickable v-ripple class="sidebar-item q-mb-xs" @click="openAlerts">
              <q-item-section avatar class="relative-position">
                <q-icon name="notifications_none" />
                <span class="bell-red-badge-drawer" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Alertas</q-item-label>
                <q-item-label caption>Avisos del viaje y ruta</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge color="negative" rounded label="2" />
              </q-item-section>
            </q-item>

            <!-- 4. Perfil -->
            <q-item clickable v-ripple class="sidebar-item q-mb-xs" @click="openProfile">
              <q-item-section avatar>
                <q-icon name="person_outline" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Perfil</q-item-label>
                <q-item-label caption>Datos del conductor</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Parte inferior de la barra lateral -->
        <div class="sidebar-bottom-actions q-pt-md">
          <q-separator class="q-mb-md" />
          <template v-if="authStore.isAuthenticated">
            <AppButton
              icon="logout"
              label="Cerrar sesión"
              @click="handleLogout"
              variant="danger"
              size="md"
              block
            />
          </template>
          <template v-else>
            <AppButton
              icon="login"
              label="Iniciar sesión"
              to="/login"
              variant="primary"
              size="md"
              block
              class="q-mb-xs"
            />
          </template>
        </div>
      </div>
    </q-drawer>

    <!-- Contenido Principal de las Páginas -->
    <q-page-container
      class="app-page-container"
      :class="{ 'app-page-container--full-screen': isFullScreenDetail }"
    >
      <router-view #default="{ Component, route: vistaRoute }">
        <component :is="Component" :key="vistaRoute.path" />
      </router-view>
    </q-page-container>

    <!-- CINTA INFERIOR DE NAVEGACIÓN (MOBILE BOTTOM BAR) -->
    <!-- Exactamente igual al diseño enviado en la imagen 2 -->
    <q-footer
      v-if="$q.screen.lt.md && !isFullScreenDetail"
      class="mobile-bottom-bar bg-white text-grey-8"
    >
      <AppButtonRow class="bottom-bar-wrapper" label="Acciones" size="lg" navigation>
        <!-- 1. Inicio -->
        <AppButton
          type="button"
          :class="{ 'is-active': currentTab === 'inicio' && route.path === '/' }"
          @click="selectTab('inicio')"
          variant="ghost"
          size="lg"
          stack
          icon="home"
          label="Inicio"
        ></AppButton>

        <!-- 2. Módulos -->
        <AppButton
          type="button"
          :class="{
            'is-active': currentTab === 'modulos' || route.path.startsWith('/movimientos'),
          }"
          aria-label="Abrir operaciones y módulos"
          @click="selectTab('modulos')"
          variant="ghost"
          size="lg"
          stack
          icon="apps"
          label="Operar"
        ></AppButton>

        <!-- 3. Alertas -->
        <AppButton
          type="button"
          :class="{ 'is-active': currentTab === 'alertas' }"
          @click="selectTab('alertas')"
          variant="ghost"
          size="lg"
          class="relative-position"
          stack
          icon="notifications_none"
          label="Alertas"
          ><span class="badge-dot-mobile"
        /></AppButton>

        <!-- 4. Perfil -->
        <AppButton
          type="button"
          :class="{ 'is-active': currentTab === 'perfil' }"
          @click="selectTab('perfil')"
          variant="ghost"
          size="lg"
          stack
          icon="person_outline"
          label="Perfil"
        ></AppButton>
      </AppButtonRow>
    </q-footer>

    <!-- DIÁLOGO: Módulos Disponibles -->
    <q-dialog v-model="modulesDialogOpen" position="bottom" :maximized="$q.screen.lt.sm">
      <AppCard class="modules-dialog-card" padding="none">
        <div class="modules-dialog-header row items-center justify-between q-px-md q-py-sm">
          <div>
            <div class="text-h6 text-weight-bold">Accesos rápidos</div>
            <div class="text-caption text-grey-6">Operaciones disponibles sin conexión</div>
          </div>
          <AppButton
            icon="close"
            aria-label="Cerrar módulos"
            v-close-popup
            variant="ghost"
            size="md"
            icon-only
          />
        </div>

        <div class="modules-dialog-content q-px-md q-pb-md">
          <div class="module-section-label">CONSULTAS</div>
          <q-list bordered separator class="module-list q-mb-md">
            <q-item clickable v-ripple @click="navigateModule('/movimientos')">
              <q-item-section avatar><q-icon name="history" /></q-item-section>
              <q-item-section
                ><q-item-label>Movimientos</q-item-label
                ><q-item-label caption>Historial de todos los viajes</q-item-label></q-item-section
              >
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="navigateModule('/movimientos/buscar')">
              <q-item-section avatar><q-icon name="search" /></q-item-section>
              <q-item-section
                ><q-item-label>Buscar movimientos</q-item-label
                ><q-item-label caption>Por cliente o granja</q-item-label></q-item-section
              >
              <q-item-section side><q-icon name="chevron_right" /></q-item-section>
            </q-item>
          </q-list>
          <div class="module-section-label">OPERACIONES DEL VIAJE</div>
          <q-list bordered separator class="module-list">
            <q-item clickable v-ripple class="module-list-item" @click="navigateModule('/viaje')">
              <q-item-section avatar>
                <q-avatar color="green-1" text-color="positive" icon="local_shipping" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Viaje en curso</q-item-label>
                <q-item-label caption>Resumen y movimientos guardados</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              class="module-list-item"
              @click="navigateModule('/viaje/compra')"
            >
              <q-item-section avatar>
                <q-avatar color="teal-1" text-color="teal" icon="add_shopping_cart" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Compra en granja</q-item-label>
                <q-item-label caption>Registrar un movimiento de compra</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              class="module-list-item"
              @click="navigateModule('/viaje/venta')"
            >
              <q-item-section avatar>
                <q-avatar color="purple-1" text-color="purple" icon="point_of_sale" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Venta en Lima</q-item-label>
                <q-item-label caption>Registrar un movimiento de venta</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              class="module-list-item"
              @click="navigateModule('/viaje/flete')"
            >
              <q-item-section avatar>
                <q-avatar color="orange-1" text-color="orange-9" icon="local_shipping" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Registrar flete</q-item-label>
                <q-item-label caption>Paquetes rosados, pardos y jumbos</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>
          </q-list>

          <div class="module-section-label q-mt-lg">CUENTA</div>
          <q-list bordered class="module-list">
            <q-item clickable v-ripple class="module-list-item" @click="navigateModule('/login')">
              <q-item-section avatar>
                <q-avatar color="blue-1" text-color="primary" icon="login" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">Iniciar sesión</q-item-label>
                <q-item-label caption>Acceso a tu cuenta guardada</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-6" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </AppCard>
    </q-dialog>

    <!-- DIÁLOGO: Alertas -->
    <q-dialog v-model="alertsDialogOpen" position="bottom" :maximized="$q.screen.lt.sm">
      <AppCard class="dialog-card">
        <div class="row items-center justify-between q-mb-sm">
          <div class="row items-center">
            <q-icon name="notifications_active" color="negative" size="24px" class="q-mr-sm" />
            <div class="text-h6 text-weight-bold">Centro de Alertas</div>
          </div>
          <AppButton icon="close" v-close-popup variant="ghost" size="md" icon-only />
        </div>

        <q-list separator
          ><q-item v-if="abierto && diaViaje(abierto.fecha_inicio) >= 3"
            ><q-item-section
              >El viaje lleva {{ diaViaje(abierto.fecha_inicio) }} días abierto.</q-item-section
            ></q-item
          ><q-item
            ><q-item-section
              >{{ pendientesMovimiento }} movimientos en curso · {{ data.pendientes }} cambios sin
              respaldar.</q-item-section
            ></q-item
          ><q-item v-if="!pendientesMovimiento && !data.pendientes"
            ><q-item-section>No hay avisos pendientes.</q-item-section></q-item
          ></q-list
        >
      </AppCard>
    </q-dialog>

    <!-- DIÁLOGO: Perfil del Usuario (Pinia) -->
    <q-dialog v-model="profileDialogOpen">
      <AppCard style="width: calc(100vw - 32px); max-width: 440px" class="dialog-card">
        <div class="text-center q-mb-md">
          <q-avatar
            size="64px"
            color="primary"
            text-color="white"
            icon="person"
            class="q-mb-sm shadow-2"
          />
          <div class="text-h6 text-weight-bold">
            {{ authStore.isAuthenticated ? authStore.userName : 'Usuario Invitado' }}
          </div>
          <div class="text-caption text-grey-7">
            {{ authStore.isAuthenticated ? authStore.userEmail : 'No has iniciado sesión' }}
          </div>
          <q-badge color="positive" class="q-mt-xs text-capitalize">
            Rol: {{ authStore.userRole }}
          </q-badge>
        </div>

        <q-separator class="q-my-md" />

        <div class="q-gutter-y-xs text-body2">
          <div class="row justify-between text-grey-8">
            <span>Base de datos:</span>
            <span class="text-weight-medium text-primary">Dexie (IndexedDB)</span>
          </div>
          <div class="row justify-between text-grey-8">
            <span>Gestor de Estado:</span>
            <span class="text-weight-medium text-secondary">Pinia (Global)</span>
          </div>
          <div v-if="authStore.currentUser?.telefono" class="row justify-between text-grey-8">
            <span>Teléfono:</span>
            <span class="text-weight-medium">{{ authStore.currentUser.telefono }}</span>
          </div>
        </div>

        <div class="q-mt-lg">
          <template v-if="authStore.isAuthenticated">
            <AppButton
              icon="logout"
              label="Cerrar sesión"
              @click="handleLogout"
              variant="danger"
              size="md"
              block
            />
          </template>
          <template v-else>
            <AppButton
              icon="login"
              label="Iniciar sesión ahora"
              to="/login"
              v-close-popup
              variant="primary"
              size="md"
              block
              class="q-mb-sm"
            />
          </template>
        </div>
      </AppCard>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppButtonRow from '@/components/ui/AppButtonRow.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import { useAuthStore } from '@/stores/auth';
import { useTransporte } from '@/composables/useTransporte';
import { diaViaje } from '@/domain/model';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const isFullScreenDetail = computed(() => $q.screen.lt.md && route.meta.fullScreen === true);
const authStore = useAuthStore();
const { data, abierto } = useTransporte();
const pendientesMovimiento = computed(
  () => data.value.movimientos.filter((m) => m.estado === 'EN_CURSO').length,
);
const { isOnline } = useNetworkStatus();

const leftDrawerOpen = ref(true);
const currentTab = ref('inicio');
const modulesDialogOpen = ref(false);
const alertsDialogOpen = ref(false);
const profileDialogOpen = ref(false);

function goToHome() {
  currentTab.value = 'inicio';
  void router.push('/');
}

function selectTab(tab: string) {
  currentTab.value = tab;
  if (tab === 'inicio') {
    void router.push('/');
  } else if (tab === 'modulos') {
    modulesDialogOpen.value = true;
  } else if (tab === 'alertas') {
    alertsDialogOpen.value = true;
  } else if (tab === 'perfil') {
    profileDialogOpen.value = true;
  }
}

function openModules() {
  modulesDialogOpen.value = true;
}

function openAlerts() {
  alertsDialogOpen.value = true;
}

function openProfile() {
  profileDialogOpen.value = true;
}

function navigateModule(path: string) {
  modulesDialogOpen.value = false;
  void router.push(path);
}

function handleLogout() {
  void authStore.logout();
  profileDialogOpen.value = false;
  $q.notify({
    type: 'info',
    message: 'Sesión cerrada correctamente',
    position: 'top',
  });
  void router.push('/login');
}
</script>

<style scoped>
.bg-surface {
  background-color: #f4f6fb;
}

/* Header estilizado */
.app-top-header {
  background-color: #f4f6fb;
  border-bottom: 1px solid rgba(226, 232, 240, 0.7);
}

.header-logo-box {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 4px 10px rgba(25, 118, 210, 0.35);
}

.header-brand-title {
  color: #0f172a;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}

/* Botón campana con punto rojo */

.bell-red-badge {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
  border: 1.5px solid #ffffff;
}

.bell-red-badge-drawer {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
}

/* Barra lateral para Desktop */
.sidebar-drawer {
  border-right: 1px solid #e2e8f0;
}

.sidebar-item {
  border-radius: 12px;
  color: #475569;
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.sidebar-item-active {
  background-color: #eff6ff !important;
  color: #1d4ed8 !important;
  font-weight: 600;
}

/* Cinta inferior de navegación (Mobile) */
.mobile-bottom-bar {
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.06);
}

/* Estado activo de la cinta inferior */

.badge-dot-mobile {
  position: absolute;
  top: -1px;
  right: -3px;
  width: 7.5px;
  height: 7.5px;
  border-radius: 50%;
  background-color: #ef4444;
  border: 1.5px solid #ffffff;
}

.modules-dialog-card {
  display: flex;
  flex-direction: column;
  width: min(100%, 520px);
  max-height: min(80vh, 720px);
  overflow: hidden;
}

.modules-dialog-header {
  flex: 0 0 auto;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.modules-dialog-content {
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.module-section-label {
  padding: 18px 4px 8px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.module-list {
  border-radius: 16px;
  overflow: hidden;
}

.module-list-item {
  min-height: 72px;
  padding-top: 10px;
  padding-bottom: 10px;
}

@media (max-width: 1023px) {
  .app-page-container {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
}

@media (max-width: 599px) {
  .modules-dialog-card {
    width: 100%;
    max-height: 100%;
    height: 100%;
  }
}

.app-page-container {
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.app-page-container--full-screen {
  padding-bottom: 0 !important;
}

@media (min-width: 1024px) {
  .app-page-container {
    padding-bottom: 24px;
  }
}
</style>

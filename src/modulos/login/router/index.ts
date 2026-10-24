import type { RouteRecordRaw } from 'vue-router';

export const loginRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: {
      requiresGuest: true,
      title: 'Iniciar Sesión | Transportes K.S.M',
    },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('../pages/RegisterPage.vue'),
    meta: {
      requiresGuest: true,
      title: 'Crear Cuenta | Transportes K.S.M',
    },
  },
];

export default loginRoutes;

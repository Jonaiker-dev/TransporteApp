import type { RouteRecordRaw } from 'vue-router';
import CompraDetallePage from '../pages/CompraDetallePage.vue';
import VentaDetallePage from '../pages/VentaDetallePage.vue';
import CapturaPage from '../pages/CapturaPage.vue';

export const viajesRoutes: RouteRecordRaw[] = [
  {
    path: '/movimientos',
    name: 'movimientos',
    component: () => import('../pages/MovimientosPage.vue'),
    meta: { title: 'Movimientos | Transportes K.S.M' },
  },
  {
    path: '/movimientos/buscar',
    name: 'movimientos-buscar',
    component: () => import('../pages/BuscarMovimientosPage.vue'),
    meta: { title: 'Buscar movimientos | Transportes K.S.M' },
  },
  {
    path: '/viaje/cierre',
    name: 'viaje-cierre',
    component: () => import('../pages/CierrePage.vue'),
    meta: { title: 'Cierre de viaje | Transportes K.S.M' },
  },
  {
    path: '/viaje/flete/:id',
    name: 'viaje-flete-detalle',
    component: CapturaPage,
    props: true,
    meta: { title: 'Detalle de flete | Transportes K.S.M', fullScreen: true },
  },
  {
    path: '/viaje',
    alias: '/viajes',
    name: 'viaje',
    component: () => import('../pages/ViajePage.vue'),
    meta: {
      title: 'Viaje en Curso | Transportes K.S.M',
    },
  },
  {
    path: '/viaje/compra',
    alias: '/viajes/compra',
    name: 'viaje-compra',
    component: () => import('../pages/CompraPage.vue'),
    meta: {
      title: 'Compra en Granja | Transportes K.S.M',
    },
  },
  {
    path: '/viaje/compra/:id',
    name: 'viaje-compra-detalle',
    component: CompraDetallePage,
    props: true,
    meta: {
      title: 'Detalle de Compra | Transportes K.S.M',
      fullScreen: true,
    },
  },
  {
    path: '/viaje/venta',
    alias: '/viajes/venta',
    name: 'viaje-venta',
    component: () => import('../pages/VentaPage.vue'),
    meta: {
      title: 'Venta en Lima | Transportes K.S.M',
    },
  },
  {
    path: '/viaje/venta/:id',
    name: 'viaje-venta-detalle',
    component: VentaDetallePage,
    props: true,
    meta: {
      title: 'Detalle de Venta | Transportes K.S.M',
      fullScreen: true,
    },
  },
  {
    path: '/viaje/flete',
    alias: '/viajes/flete',
    name: 'viaje-flete',
    component: () => import('../pages/FletePage.vue'),
    meta: {
      title: 'Registro de Flete | Transportes K.S.M',
    },
  },
];

export default viajesRoutes;

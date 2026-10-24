import { defineRouter } from '#q-app';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { loginRoutes } from '@/modulos/login/router';
import { viajesRoutes } from '@/modulos/viajes/router';

/*
 * Combina las rutas de los módulos con las auto-rutas de Quasar.
 * Las rutas de módulos se anteponen para asegurar prioridad sobre comodines 404.
 */
const catchAllRoutes = routes.filter(
  (r) =>
    r.path === '/:path(.*)*' ||
    r.path === '/:path(.*)' ||
    (r.name && String(r.name).includes('[...path]')),
);
const standardRoutes = routes.filter((r) => !catchAllRoutes.includes(r));

const appLayoutRoute = standardRoutes.find((route) => route.path === '/');

if (!appLayoutRoute) {
  throw new Error('No se encontró la ruta raíz que contiene el layout principal de la aplicación.');
}

const routesWithTravelPages = standardRoutes.map((route) =>
  route === appLayoutRoute
    ? { ...route, children: [...(route.children ?? []), ...viajesRoutes] }
    : route,
);

const allRoutes = [...loginRoutes, ...routesWithTravelPages, ...catchAllRoutes];

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes: allRoutes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE),
  });

  Router.beforeEach((to) => {
    if (to.meta?.title) {
      document.title = to.meta.title as string;
    }
  });

  // enable HMR for it
  if (import.meta.hot) {
    handleHotUpdate(Router);
  }

  return Router;
});

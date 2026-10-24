# Revisión: formulario de registro fuera de pantalla

- Tarea: corregir la pantalla vacía al abrir el registro.
- Causa comprobada: la clase Quasar `fullscreen` fija la altura y `column` permite
  envolver los hijos. Al superar la altura disponible, el formulario pasaba a otra
  columna. En una pantalla de 390 px, `main` comenzaba en x=390 y quedaba oculto por
  `overflow-x: hidden`. El contenido existía en el DOM, pero no se veía.
- Cambios: retirar `fullscreen`, impedir el salto de columna con `no-wrap` y usar
  ancho del contenedor. Aplicar la misma corrección al login, que comparte el patrón.
  Mostrar `errorMessage` dentro del formulario de registro con `role="alert"`.
- Archivos: `src/modulos/login/pages/RegisterPage.vue`, `LoginPage.vue` y
  `tests/e2e/registro.spec.ts`. Se recompila la PWA y se actualiza el ZIP para Netlify.
- Cambios locales previos: preservados. No se modificó persistencia ni autenticación
  remota ni se crearon cuentas de prueba en Supabase.

| Comprobación                  | Procedimiento y resultado                                                                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reproducción antes del cambio | Navegador Edge con Playwright: formulario fuera del ancho; captura `test-results/registro-antes.png`                                                                                                                                   |
| Regresión previa              | `npm run test:e2e -- tests/e2e/registro.spec.ts --grep 390x844 --timeout 15000`: falla antes del cambio. El ejecutor se interrumpió al quedar abierto tras reportar el fallo                                                           |
| Compilación                   | `npm run build:pwa`: correcta, código 0                                                                                                                                                                                                |
| Validación después del cambio | Script Node con Playwright y Edge, salida 0: navegación login → registro → login en 360x640, 390x844 y 768x1024; título dentro de pantalla, formulario dentro del ancho, botón alcanzable y validación visible; sin errores JavaScript |
| Inspección visual             | Captura corregida de 390 px revisada; capturas guardadas en `test-results/registro-*-corregido.png`                                                                                                                                    |
| Formato y análisis            | Prettier, ESLint sobre los dos componentes y la prueba, y `git diff --check`: correctos                                                                                                                                                |
| Paquete                       | Actualizado `dist/transporteapp-netlify.zip` con la compilación corregida                                                                                                                                                              |

| Criterio                                              | Estado                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| Registro visible y accesible con scroll en celular    | Cumplido localmente                                 |
| Error de validación visible dentro del formulario     | Cumplido localmente                                 |
| Protección del login frente al mismo salto de columna | Cumplido localmente                                 |
| Verificación sobre la URL Netlify publicada           | Pendiente de publicar                               |
| Creación real de cuenta y confirmación de correo      | No ejecutada; esta corrección afecta a presentación |

- Decisión: conservar el flujo y diseño actuales; corregir el contenedor y reutilizar
  el mensaje de error existente. No se alteran rutas, base local ni contratos remotos.
- Siguiente paso: publicar la carpeta `dist/pwa` o el ZIP actualizado. No se hizo
  despliegue, commit ni push.

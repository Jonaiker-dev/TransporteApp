# Revisión de pantallas compactas

- Tarea: adaptación a 320–340 px, control del zoom táctil y fuentes grandes, autorizada en la conversación. No corresponde al inicio de una fase nueva.
- Cambios: navegación inferior de una fila, precios adaptables, cabeceras con salto de línea, teclado con altura suficiente para el texto, reserva al desplazar hacia barras fijas y configuración de viewport y ajuste automático de fuentes.
- Archivos: `index.html`, `src/css/app.css`, `AppButton`, `AppButtonRow`, `TecladoPesos`, `PreciosMovimiento`, cabecera de viaje, compra, venta, captura, layout principal y campo de autenticación. Pruebas en `tests/e2e/mobile-compacto.spec.ts` y ampliación de `tests/e2e/registro.spec.ts`.
- Cambios previos: árbol limpio al iniciar; sin cambios ajenos incluidos.

| Comprobación          | Procedimiento                                          | Resultado                                    |
| --------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Compilación PWA       | `npm run build:pwa`                                    | Ejecutada, aprobada                          |
| Tipos                 | `npm run typecheck` y comprobación del build           | Ejecutada, aprobada                          |
| Componentes y formato | `npm run lint:check`                                   | Ejecutada, aprobada                          |
| Pruebas unitarias     | `npm test`                                             | Ejecutada: 11 archivos, 39 pruebas aprobadas |
| Navegador compacto    | Playwright con Edge, 320/340/390 px, normal y ampliado | Ejecutada, aprobada                          |
| Gesto de pinza        | CDP `Input.synthesizePinchGesture`, escala 2           | Ejecutada, aprobada                          |
| Dispositivos físicos  | Fuentes del sistema, Safari y accesibilidad            | Pendiente                                    |

| Criterio                                             | Estado                   | Evidencia                                              |
| ---------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| Navegación sin apilar y acciones sin solaparse       | Cumplido                 | Geometría de botones y barras en navegador             |
| Crear compra, capturar y editar precios a 320/340 px | Cumplido                 | Flujo funcional y capturas locales                     |
| Configuración de escala y texto presente             | Cumplido                 | Viewport, `text-size-adjust`, `touch-action`           |
| Bloquear todo zoom en cualquier navegador            | Limitación de plataforma | Safari y accesibilidad pueden ignorar la configuración |

- Navegador: 15 pruebas aprobadas en total: siete casos compactos/zoom, uno de detalle sin red, cinco de registro, uno de precios/PDF y uno de uniformidad en claro/oscuro. Los casos de registro incluyen 320×640 y 340×640. Se ejecutaron contra `dist/pwa` mediante la configuración temporal ignorada `.quasar/compact-review.config.mts`, que importa la configuración del proyecto y omite iniciar/cerrar otro servidor. El servidor de pruebas iniciado por esta sesión se reutilizó porque el cierre automático del ejecutor quedó esperando en Windows. Comandos: `npm run test:e2e -- --config .quasar/compact-review.config.mts` seguido de los archivos correspondientes; los dos tamaños nuevos de registro se aislaron con `--grep "320x640|340x640"`. No se modificó la configuración permanente de Playwright.

- Riesgos: la simulación de texto ampliado no sustituye una prueba de las preferencias del sistema. El usuario puede forzar zoom desde opciones del navegador; no existe un bloqueo universal desde la web.
- Decisión: [ADR-010](decisiones/010-pantallas-compactas-y-escala.md).
- Entrega: commit y push autorizados expresamente; sin migraciones ni despliegue manual.

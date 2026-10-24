# Revisión: compartir PDF con nombre elegido

- Tarea: acción «Compartir PDF» en movimiento, viaje y vista previa, aprobada por el usuario en esta conversación.
- Cambios y motivo: `CompartirPdf.vue` genera o reutiliza el PDF, solicita nombre y entrega un `File` al panel nativo de compartir. La confirmación permite elegir WhatsApp u otra aplicación disponible. El archivo se genera antes de pedir el nombre para conservar la activación del toque final.
- Archivos modificados en esta tarea: `src/services/exportaciones.ts`, nuevo `src/components/CompartirPdf.vue`, `src/components/VistaPreviaPdf.vue`, `src/modulos/viajes/pages/CapturaPage.vue`, `src/modulos/viajes/pages/ViajePage.vue`, nueva prueba `tests/e2e/compartir-pdf.spec.ts`, ADR-008 e índice de decisiones.
- Cambios locales previos preservados: correcciones en celda, edición de precios, nombres de descarga y su documentación de las tareas anteriores. Sin nuevas dependencias, cambios de datos ni operaciones remotas.

| Comprobación    | Comando o procedimiento real                                                         | Resultado                              | Evidencia o bloqueo                                                                                        |
| --------------- | ------------------------------------------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Unitarias       | Node 24: `npm test`                                                                  | Ejecutado: 37 aprobadas en 11 archivos | Suite existente conservada                                                                                 |
| Tipos           | Node 24: `npm run typecheck`                                                         | Ejecutado: aprobado                    | Aviso existente de vue-router sobre `rootDir`                                                              |
| Lint/formato    | Node 24: `npm run lint:check`                                                        | Ejecutado: aprobado                    | Se conserva la causa del error nativo exigida por ESLint                                                   |
| Compilación     | Node 24: `npm run build:pwa`                                                         | Ejecutado: aprobado                    | PWA y service worker generados localmente                                                                  |
| Navegador       | Playwright: compartir PDF, UI/precios/PDF y flujo                                    | Ejecutado: 4 pruebas aprobadas         | API nativa sustituida para observar nombre, MIME, firma PDF, activación del toque, cancelaciones y errores |
| Teléfono físico | Abrir la PWA con HTTPS en Android/iOS, compartir un PDF renombrado y elegir WhatsApp | Pendiente                              | Sin acceso a un teléfono físico en esta sesión; no se ha enviado ningún documento a WhatsApp               |

| Criterio de aceptación                               | Estado                          | Evidencia                                                               |
| ---------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| Nombre antes de compartir desde los tres accesos     | Cumplido                        | Mismo servicio y componente en movimiento, viaje y visor                |
| Cancelar sin enviar ni descargar                     | Cumplido                        | Cancelación del nombre y `AbortError` del sistema terminan sin descarga |
| Alternativa si compartir archivos no está disponible | Cumplido                        | Aviso y confirmación «Descargar» conservan el nombre elegido            |
| Envío real a WhatsApp                                | Pendiente de dispositivo físico | El destino lo elige el usuario en el panel del teléfono                 |

- Riesgos o limitaciones: navegador y sistema determinan soporte y destinos. WhatsApp debe estar disponible como destino del panel. Preparar PDF no necesita subir el documento; enviarlo mediante WhatsApp depende de esa aplicación y su conectividad. La descarga directa existente se conserva.
- Decisión registrada: [ADR-008](decisiones/008-compartir-pdf.md).
- Siguiente paso: revisión y prueba real en móvil. No se hizo commit ni despliegue; publicar requiere autorización explícita.

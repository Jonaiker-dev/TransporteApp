# Revisión de UI, precios y PDF

Fecha: 23 de octubre de 2026. Alcance autorizado por el usuario: corregir la UI tomando como referencia `docs/template/demo-pesos.html`, completar precios faltantes una sola vez incluso después del cierre, revisar pesos duplicados y permitir visualizar o descargar el PDF. Afecta las fases 4, 5, 6, 7 y 8. Los cambios locales anteriores se conservaron; no se hicieron commits ni despliegues.

## Cambios y motivo

La captura sigue la jerarquía de la demo: cabecera del movimiento, selección de granja en venta, tipos de huevo dentro del teclado, peso grande, último registro, teclado, columnas compactas y pie con totales y una acción principal. Conserva el azul y las tarjetas del proyecto. El teclado se compacta en pantallas de poca altura. La información de respaldo se abre desde un indicador discreto en inicio.

Las compras y ventas permiten completar los precios faltantes mediante una sola confirmación por movimiento. Los precios existentes, incluido cero, no cambian. Los tipos que ya tienen paquetes son obligatorios; los demás son opcionales. Después de guardar no se pueden añadir más precios a ese movimiento. Funciona con movimiento y viaje cerrados, conserva el cierre y recalcula importes y ganancia. Una transacción guarda el bloqueo y la cola de respaldo; si falla, se puede volver a intentar.

Dos pesos iguales de la misma granja y tipo se muestran como «12.90 ×2 disponibles». Cada toque marca un paquete existente por antigüedad. El segundo marca el restante y un tercero avisa que ya están marcados ambos. Se pueden quitar individualmente de la venta. Este comportamiento FIFO ya existía en el repositorio; se conserva y ahora se comprueba también desde la UI.

«Ver PDF» abre el documento real generado por pdfmake, dibujado con PDF.js. Incluye páginas, zoom, descarga y apertura en otra pestaña; funciona sin conexión después de instalarse el caché PWA. La descarga PDF evita el panel nativo de compartir. Los movimientos en curso muestran un comprobante identificado como borrador. El visor está encapsulado para retirarlo cuando deje de ser necesario.

## Archivos principales

- UI: `CapturaPage.vue`, `TecladoPesos.vue`, `ColumnasPesos.vue`, `EstadoRespaldo.vue` y variables de `app.css`.
- Precios: `PreciosMovimiento.vue`, `domain/model.ts`, `repositories/transporte.ts` y migración SQL aditiva `202610230002_completar_precios.sql`.
- PDF: `VistaPreviaPdf.vue`, `services/exportaciones.ts`, `services/formatos.ts`, acción en `ViajePage.vue`, dependencia PDF.js, precache y MIME de su worker.
- Evidencia: pruebas de repositorio y `tests/e2e/ui-precios-pdf.spec.ts`. Decisión: [ADR-002](decisiones/002-ui-precios-y-preview-pdf.md).

## Validación

Las pruebas de repositorio cubren precios con viaje cerrado, persistencia al reabrir la base, precio cero, valores inválidos, dos intentos concurrentes y rollback si falla la cola. La suite móvil cubre dos pesos 12.90, tercer intento, desmarcado, asignación de precios después del cierre, bloqueo tras recargar y ganancia recalculada.

El visor se comprueba offline verificando píxeles del canvas, el encabezado `%PDF-` del archivo descargado y que no se invoque el mecanismo nativo de compartir. Las capturas se generan en `test-results/`, excluido de Git. No contienen información real del usuario.

| Comprobación ejecutada         | Resultado                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `npm run lint:check`           | Prettier y ESLint correctos                                                        |
| `npm run typecheck`            | Correcto                                                                           |
| `npm test`                     | 27 pruebas en 8 archivos, correctas                                                |
| `npm run build:pwa`            | Compilación PWA correcta                                                           |
| `npm run test:e2e`             | 3 pruebas móviles correctas; incluye el flujo anterior y la carga de 3000 paquetes |
| Capturas revisadas visualmente | Compra y venta a 390 × 844, venta oscura a 360 × 780 y PDF móvil                   |

Se verificó que el botón de marcar queda por encima del pie fijo en ambos tamaños, que no hay desbordamiento horizontal y que las teclas mantienen fondo y texto legibles en modo oscuro. También se corrigieron selectores globales de estilos oscuros que estaban afectando al cuerpo de la página en lugar de sus elementos.

Capturas: `ui-compra-mobile.png`, `ui-venta-mobile.png`, `ui-venta-oscuro-360.png` y `ui-preview-pdf-mobile.png`, todas dentro de `test-results/`.

## Límites operativos

La migración SQL está entregada, no aplicada remotamente. Si se usa Supabase, aplicar primero la migración inicial y después `202610230002_completar_precios.sql` antes de respaldar movimientos con el campo nuevo. IndexedDB conserva la misma versión porque la propiedad no cambia claves ni índices.

La validación de navegador usa Edge con tamaños móviles; queda pendiente probar instalación y descarga en dispositivos Android/iPhone físicos. No se ha repetido Lighthouse en esta revisión; las puntuaciones del informe anterior son históricas.

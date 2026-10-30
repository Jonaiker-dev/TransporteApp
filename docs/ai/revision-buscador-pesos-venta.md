# Revisión del buscador de pesos en ventas

- Tarea: sustituir la calculadora de las ventas con pesos de compra por un buscador numérico.
- Cambios: campo con etiqueta visible, teclado decimal nativo, normalización de coma, limpieza de símbolos y acción de limpiar con retorno del foco. La búsqueda por prefijo no registra paquetes; cada resultado se selecciona expresamente. Resultados antes de marcados y tipos con nombres cortos para aprovechar 320 px.
- Archivos: `src/modulos/viajes/pages/CapturaPage.vue`; nueva prueba `tests/e2e/buscar-pesos-venta.spec.ts`; adaptación de pruebas de flujo, cancelación y precios/PDF. Decisión [ADR-011](decisiones/011-buscador-pesos-venta.md).
- Cambios locales previos: árbol limpio al iniciar; no se modificaron datos ni dependencias.

| Comprobación       | Procedimiento real                                                                                       | Resultado           |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------------- |
| Build y tipos      | `npm run build:pwa`, incluido el comprobador de tipos                                                    | Ejecutada, aprobada |
| UI, formato y lint | `npm run lint:check`                                                                                     | Ejecutada, aprobada |
| Navegador          | Playwright: buscador en 320/340/390 px, flujo offline, cancelación, precios/PDF y uniformidad de botones | Aprobada: 7 pruebas |
| Revisión visual    | Captura de venta a 320 px, con tipos en una fila y buscador sobre resultados                             | Ejecutada           |

| Criterio                                    | Estado   | Evidencia                                |
| ------------------------------------------- | -------- | ---------------------------------------- |
| Sin calculadora en ventas con pesos previos | Cumplido | Ausencia de teclas y ajustes del teclado |
| Solo dígitos y separador decimal            | Cumplido | Normalización de entrada y texto pegado  |
| Buscar y Enter no marcan paquetes           | Cumplido | Cero paquetes hasta tocar un resultado   |
| Duplicados, deshacer y limpiar              | Cumplido | Pruebas funcionales en tres anchos       |
| Compra y venta directa conservan captura    | Cumplido | Regresión de flujo completo              |

- Entorno: servidor local `node tests/serve.mjs` y configuración temporal ignorada `.quasar/compact-review.config.mts`, que importa la configuración existente y reutiliza ese servidor para evitar el bloqueo de cierre observado en Windows. No se modificó la configuración permanente de Playwright.
- Comando de navegador: `node node_modules/@playwright/test/cli.js test --config .quasar/compact-review.config.mts tests/e2e/buscar-pesos-venta.spec.ts tests/e2e/ui-precios-pdf.spec.ts tests/e2e/flujo.spec.ts tests/e2e/cancelar-movimiento.spec.ts tests/e2e/uniformidad-botones.spec.ts --reporter=list`.
- Resultado: cinco casos funcionales aprobados en la ejecución conjunta. Las regresiones de precios/PDF y uniformidad alcanzaron sus comprobaciones pero fallaron al guardar trazas por archivos temporales compartidos (`ENOENT`); se repitieron ambas con `--output test-results/buscador-regresiones` y aprobaron: `2 passed (44.5s)`.
- Limitación: el teclado mostrado depende del navegador y del dispositivo; `inputmode` solicita el decimal y el saneamiento de entrada aplica también al pegado. No se comprobó el teclado en un teléfono físico.

# Ejecución de las diez fases

Revisión posterior solicitada por el usuario: [UI, precios faltantes y vista previa PDF](revision-ui-precios-pdf.md). Este informe conserva la evidencia de la ejecución inicial; ADR-002 documenta la nueva excepción para precios de movimientos cerrados.

Fecha: 23 de octubre de 2026, America/Lima. El usuario autorizó revisar e implementar todas las fases sin aprobaciones intermedias, manteniendo la UI existente y priorizando móvil. No se hicieron commits ni despliegues. Las decisiones de adaptación están en [ADR-001](decisiones/001-adaptacion-proyecto-existente.md).

## Diagnóstico y resultado por fase

| Fase                            | Lo que existía                                                                                  | Lo completado o corregido                                                                                                                                                                            | Evidencia y límites                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · Base                        | Quasar/Vue/TS, manifest, service worker y una Dexie versión 4 con movimientos agregados         | Modelo UUID, migración conservando histórico, repositorios, cola transaccional, dominio puro y pruebas; esquema en `src/db/` con reexport compatible                                                 | Tests de pesos, teclado, columnas, mediana, ganancia, transacciones y migración real v4 → v7 con fake-indexeddb. PWA compilada. Instalación física pendiente                              |
| 2 · Viajes                      | Inicio e indicadores con fechas, cantidades e historial de demostración; cierre solo en memoria | Inicio de viaje manual, apertura única, cierre/reapertura persistentes, historial real, KPIs reactivos, aviso a los tres días, stock por tipo y pendientes                                           | Aperturas concurrentes y bloqueo de cierre probados; E2E conserva dos paquetes al iniciar otro viaje                                                                                      |
| 3 · Formulario                  | Formularios y creación local de clientes/granjas                                                | Partes con roles y búsqueda sin tildes, fechas Lima, precios enteros opcionales, costo promedio de referencia y navegación a captura                                                                 | E2E crea parte desde el selector y registra compra/venta con precio. Un precio vacío no se convierte en costo cero                                                                        |
| 4 · Captura                     | Detalles de compra y venta de prueba                                                            | Teclado propio, cuatro toques por peso, punto/registro automáticos apagables, deshacer, teclado físico, aviso de mediana y vibración cuando exista, columnas de diez con últimas dos por tipo        | Test de componente `12.4` → `12.40`; E2E persiste al recargar y captura offline. Prueba con 1500 paquetes en el movimiento y 3000 en la base                                              |
| 5 · Venta con compra            | Sin marcado de paquetes                                                                         | Una granja seleccionada, stock por tipo, prefijo, duplicados agrupados, lista virtualizada hasta 60, FIFO por fecha/orden, últimos ocho marcados, desmarcado y liberación al cancelar                | Tests de duplicados 12.90, tercer intento, reserva concurrente y ausencia de paquetes nuevos; E2E vende con costo de compra                                                               |
| 6 · Venta directa y terminación | Checkbox sin captura funcional                                                                  | Paquetes sin compra, estados EN_VENTA/VENDIDO, confirmación atómica, detalle terminado de solo lectura y aviso de costo desconocido                                                                  | Test de 300 paquetes y rollback de confirmación fallida; E2E compra y ambos modos de venta                                                                                                |
| 7 · Ganancia                    | Sin cálculo por jaba y lote                                                                     | Ganancia bruta por costo de origen en inicio, viaje, cards, captura y cierre; signo, porcentaje, exclusiones, stock a costo y aviso de venta bajo costo                                              | Tests de lotes, faltantes, remanente y venta bajo costo; E2E valida +S/ 21.45 en la venta conocida                                                                                        |
| 8 · Exportación                 | Sin exportadores                                                                                | PDF A4 y Excel por movimiento/viaje, columnas compartidas, fórmulas SUM con valores cacheados, encabezados y totales, generación en worker, compartir/descargar                                      | Tests generan PDF y verifican fórmulas/totales Excel con 300 paquetes. E2E descarga ambos formatos; el worker mantiene activo el hilo de UI                                               |
| 9 · Respaldo                    | Outbox genérica sin servidor; login local de demostración                                       | SQL con RLS y relaciones por propietario, Auth de Supabase, push idempotente, lotes de 200, colapso, backoff, acuses resistentes a cambios concurrentes, apertura/online/manual, persistencia y JSON | Simulación de 1500 paquetes, fallo/reintento sin duplicar y cambio local durante envío. **Pendiente configuración y validación real en Supabase**; SQL entregado, no aplicado remotamente |
| 10 · Fletes y revisión          | Registro y edición de fletes simples                                                            | Cliente con crear al vuelo, líneas tipadas, listado/búsqueda, detalles/exportación, respeto a solo lectura; suite móvil y carga; documentación operativa                                             | E2E registra/busca flete y recorre cierre. Viewport 390 × 844 y ausencia de errores JS; pruebas físicas e instalación Android/iPhone pendientes                                           |

## Verificación automatizada

- `npm run lint:check`: formato y ESLint sin modificar archivos.
- `npm run typecheck`: comprobación de tipos.
- `npm test`: 24 pruebas aprobadas en ocho archivos, incluyendo dominio, componente, migración, repositorios, exportadores y motor push simulado.
- `npm run build:pwa`: compilación de UI, worker de exportación, service worker y precache.
- `npm run test:e2e`: flujo completo móvil y carga de 3000 paquetes. En este entorno Windows se requiere ejecutar fuera del sandbox para que Playwright pueda terminar el servidor de pruebas; no es un requisito de producción.

Las dos pruebas E2E finales pasaron en 28.2 segundos en esta máquina. El flujo completo incluye exportaciones PDF y Excel después de desconectar la red, cambio de tema y contraste del botón en oscuro. La prueba de carga mantiene como máximo 60 celdas de pesos visibles y verifica que el hilo de UI siga activo al exportar.

Las capturas/trazas y los informes de auditoría se generan en `test-results/`, ignorado por Git. Una prueba de servidor simulado no demuestra funcionamiento de la cuenta Supabase ni sus políticas remotas.

## Auditoría móvil final

Lighthouse 13.5.0 sobre la pantalla de inicio sin datos, con carga inicial y red/CPU móvil simuladas, servido localmente con gzip:

| Indicador                  | Resultado |
| -------------------------- | --------- |
| Rendimiento                | 76/100    |
| Accesibilidad automatizada | 100/100   |
| Buenas prácticas           | 100/100   |
| Largest Contentful Paint   | 4.4 s     |
| Cumulative Layout Shift    | 0.037     |

Se corrigieron contrastes de textos secundarios, botones en oscuro y el desplazamiento del aviso de respaldo. Supabase se carga de forma diferida y la exportación se ejecuta en worker. La carga inicial bajo la simulación sigue teniendo margen de optimización; no se presenta 76 como una puntuación de rendimiento excelente ni como una medición de teléfonos físicos.

Esta versión instalada de Lighthouse no ofrece una categoría PWA. Por eso el criterio original «pasa Lighthouse PWA» no se declara cumplido literalmente: se verifica en su lugar la compilación del manifest standalone/service worker y el flujo real de recarga, captura y exportación sin conexión. La instalación en dispositivos físicos conserva su pendiente explícito.

## Límites de aceptación

La base histórica se conserva sin fabricar stock. Los pesos anteriores agregados pueden contener decimales en el archivo legado; los nuevos paquetes siempre almacenan `peso_c` entero. No se pueden reconstruir ganancias históricas sin pesos y precios de origen.

No se ha aplicado SQL, creado una cuenta externa ni probado modo avión contra Supabase. Falta configurar URL/clave pública y validar el acceso con dos usuarios reales en el proyecto de destino. La UI funciona sin esos servicios y comunica los cambios pendientes.

Las pruebas móviles emulan Chromium/Edge, no hardware Android/iOS. Vibración, permisos de almacenamiento persistente, instalación y compartir nativo requieren comprobación manual en esos dispositivos. La demo HTML externa no fue proporcionada; se conservó la UI del propio proyecto como referencia visual.

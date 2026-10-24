# Revisión: historial y búsqueda de movimientos

- Tarea: ampliación aprobada el 24 de octubre de 2026. No cambia el estado de las fases originales.
- Cambios: apertura desde toda la tarjeta mediante clic, Enter o espacio; historial de todos los viajes; búsqueda común de clientes, granjas y dueños de flete; filtros por fecha, movimiento y estado; retorno con consulta conservada en la URL; carga visible de 40 registros por tanda.
- Archivos: `MovimientoCard.vue`, `MovimientosVista.vue`, `MovimientosPage.vue`, `BuscarMovimientosPage.vue`, `useMovimientos.ts`, `viajes.api.ts`, rutas de viajes, `ViajePage.vue`, `CapturaPage.vue` y accesos de Inicio/Operar. Pruebas en `useMovimientos.test.ts` y `tests/e2e/movimientos.spec.ts`.
- Cambios locales previos: el árbol estaba limpio al comenzar; no se reemplazaron módulos ni se alteraron datos.

| Comprobación          | Procedimiento                                                     | Resultado           | Evidencia                                                                          |
| --------------------- | ----------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Tipos                 | `npm run typecheck`                                               | Ejecutada, correcta | Sin errores; aviso existente de rootDir del router                                 |
| Pruebas automatizadas | `npm test`                                                        | Ejecutada, correcta | 34 pruebas en 11 archivos                                                          |
| Compilación           | `npm run build:pwa`                                               | Ejecutada, correcta | PWA compilada en `dist/pwa`                                                        |
| Contrato UI           | `npm run check:ui`                                                | Ejecutada, correcta | Wrappers de botones y tarjetas conservados                                         |
| ESLint                | Ejecución sin autofix sobre los archivos fuente modificados       | Ejecutada, correcta | Sin errores                                                                        |
| Formato               | Prettier `--check` sobre los archivos de la tarea                 | Ejecutada, correcta | Formato correcto                                                                   |
| Navegador             | Playwright: `movimientos.spec.ts` y `cancelar-movimiento.spec.ts` | Ejecutada, correcta | Apertura, teclado, filtros, retorno, histórico entre viajes, offline y cancelación |
| Presentación          | Capturas en claro y oscuro; anchos 360, 390 y 768 px              | Ejecutada           | Capturas locales en `test-results`; sin desbordamiento horizontal                  |

| Criterio                                   | Estado                          | Evidencia                                                                                            |
| ------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Abrir por tarjeta sin botón de detalle     | Cumplido                        | Prueba de clic y Enter en navegador; no existe el botón anterior                                     |
| Consultar movimientos de viajes anteriores | Cumplido                        | Compra del viaje cerrado visible junto a movimientos del nuevo viaje                                 |
| Búsqueda común sin separación por rol      | Cumplido                        | Una entrada de texto; prueba de nombres sin tildes y mayúsculas, compras, ventas vinculadas y fletes |
| Conservar búsqueda al volver               | Cumplido                        | URL y texto restaurados desde el detalle                                                             |
| Uso offline                                | Cumplido en navegador de prueba | Recarga y búsqueda sin red con el service worker activo                                              |
| Mantener diseño existente                  | Cumplido                        | Wrappers y tokens actuales; capturas de ambos temas                                                  |

- Incidencia de validación resuelta: la primera prueba buscaba el selector de tema en la página de movimientos. Se corrigió para usar el control existente en Inicio. El cierre automático del servidor de Playwright quedó esperando en Windows; la comprobación final usa el mismo servidor local iniciado por separado y una configuración temporal sin `webServer`.
- Limitaciones: la fotografía local completa sigue en memoria. El límite progresivo reduce el DOM, no el volumen de Dexie. Los históricos sin paquetes individuales solo se relacionan por su parte directa. No se ha verificado esta tarea en dispositivos físicos ni contra un respaldo remoto real.
- Decisión: [ADR-005](decisiones/005-historial-y-busqueda-movimientos.md).
- Siguiente paso: revisión del usuario. No se hicieron commit, push ni despliegue.

## Autocompletado solicitado

- Se reemplazó el campo de texto por QSelect con entrada libre, sugerencias unificadas de las partes locales y selección mediante clic o teclado. Las coincidencias ignoran tildes y mayúsculas. Se muestran hasta 20 nombres ordenados, sin duplicados normalizados; no se crean partes al consultar.
- Archivos: `MovimientosVista.vue` y ampliación del recorrido `movimientos.spec.ts`; se conservan los demás cambios anteriores.
- Comprobaciones ejecutadas: TypeScript, ESLint del componente, contrato UI y compilación PWA correctos. Playwright: 1 prueba aprobada en 25 segundos; comprueba clientes y granjas, selección por teclado y clic, retorno con el nombre seleccionado y autocompletado sin red. Formato y diff comprobados sin errores.

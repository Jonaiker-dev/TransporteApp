# Revisión: rapidez al crear movimientos

- Tarea: resolver la demora y los estados vacíos al crear compras, ventas y fletes.
- Causa reproducida: varias suscripciones leían toda la base; el guardado esperaba
  recargas repetidas de listas y resúmenes. La lista de viaje se rellenaba desde
  consultas asíncronas separadas, inicialmente vacías y susceptibles a carreras.
- Cambios: una lectura compartida de Dexie, navegación después de la publicación
  del guardado local, respuesta de creación sin releer todo el historial y proyección
  de lista y resumen desde la misma instantánea. Índices temporales en memoria evitan
  buscar todos los paquetes por cada movimiento y repetir el cálculo de ganancia.
- Archivos: `src/composables/useTransporte.ts`, `src/modulos/viajes/api/viajes.api.ts`,
  `src/modulos/viajes/composables/useViaje.ts`, `ViajePage.vue`, dos archivos de pruebas
  unitarias y `tests/bench-movimientos.mjs`. Se adapta el arranque de la prueba de
  rendimiento existente a su fixture, que escribe directamente con IndexedDB nativo.
- Cambios locales previos: conservados. No se modificaron esquema, datos del usuario,
  cálculos de dinero, teclado, exportaciones, rutas ni las operaciones de Supabase.

## Comparación reproducible

Prueba con Edge, viewport 390x844 y perfil temporal: 12 viajes, 600 movimientos y
30 000 paquetes sintéticos. Los datos se insertan antes de medir. El tiempo incluye
el clic y la aparición del movimiento de destino. Las llamadas `getAll` se cuentan
durante la creación y los 200 ms posteriores a la aparición del contenido.

| Movimiento | Antes   | Después | Lecturas `getAll` antes → después |
| ---------- | ------- | ------- | --------------------------------- |
| Compra     | 7533 ms | 1240 ms | 114 → 11                          |
| Venta      | 8031 ms | 961 ms  | 123 → 9                           |
| Flete      | 7955 ms | 964 ms  | 130 → 6                           |

La comprobación final observa el DOM y exige que no aparezcan «No se encontró el
movimiento» ni «No hay movimientos en este viaje» durante esas creaciones. Después
de recargar, comprueba que permanecen los tres movimientos nuevos. El resultado fue
correcto y no hubo errores JavaScript. Son mediciones locales, no una garantía de
latencia en todos los teléfonos o para cualquier tamaño de historial.

Para repetir, compilar la PWA y ejecutar `node tests/bench-movimientos.mjs` con el
puerto 4173 libre. Usa un perfil de navegador aislado y no abre la base del usuario.

| Comprobación              | Resultado                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pruebas de lógica y datos | `npm test`: 33 pruebas aprobadas en 10 archivos                                                                                                                                     |
| Nuevas coberturas         | Suscripción compartida, navegación sin perder datos, reinicio, errores y espera de publicación; creación sin snapshot extra; ganancias, históricos, remanente entre viajes y fletes |
| Compilación               | `npm run build:pwa`: correcta, incluye comprobación TypeScript                                                                                                                      |
| Análisis y formato        | ESLint, Prettier y revisión del diff sobre los archivos modificados                                                                                                                 |
| Medición grande           | Benchmark final correcto, código 0, sin estados vacíos ni pérdida tras recargar                                                                                                     |
| Navegador                 | Casos existentes de flujo offline, 3000 paquetes y precios/PDF: los tres reportaron aprobación; el proceso quedó en cierre y se interrumpió tras reportar los tres casos aprobados  |
| Paquete                   | Se regenera `dist/transporteapp-netlify.zip` con la compilación corregida                                                                                                           |

| Criterio de aceptación                                       | Estado                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| Reducir la demora reproducida en compra, venta y flete       | Cumplido localmente: aproximadamente 84–88 % menos tiempo            |
| No sustituir datos por listas vacías durante esas creaciones | Cumplido en el benchmark final                                       |
| Conservar guardado atómico, cola e inventario                | Cubierto por las pruebas aprobadas; sin cambios en las transacciones |
| Mantener captura y exportación sin conexión                  | Casos de navegador aprobados                                         |
| Verificar en el teléfono y hosting del usuario               | Pendiente de publicar y probar allí                                  |

- Decisión: [ADR-004](decisiones/004-lectura-local-compartida.md).
- Siguiente paso: publicar la nueva carpeta `dist/pwa` o su ZIP en Netlify.
- No se hizo despliegue, commit, push ni operación remota.

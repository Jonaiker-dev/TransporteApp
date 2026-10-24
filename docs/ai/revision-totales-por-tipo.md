# Revisión: peso y valor por tipo en movimientos

- Tarea: mostrar totales de peso y dinero por tipo de huevo en compras y ventas,
  manteniendo el resto de la aplicación igual.
- Cambios: tabla «Totales por tipo» debajo de las columnas de pesos, con Rosado,
  Pardo y Jumbo cuando tienen paquetes. Peso con dos decimales y valor en S/.
  Sin precio asignado, se indica «Sin precio»; precio cero conserva S/ 0.00.
- Archivo de aplicación: `src/modulos/viajes/pages/CapturaPage.vue`, compartido por
  la captura y el detalle de compras y ventas. El bloque de fletes no incluye la tabla.
- Cambios locales previos: se conservaron las correcciones del login/registro y sus
  archivos de revisión y prueba. No se alteraron inicio, viajes, fletes, exportaciones,
  teclado, totales generales, repositorios ni sincronización.

## Decisión

- Estado: aceptada mediante la solicitud explícita del usuario.
- Contexto: ya se muestran columnas y total general, pero faltaba el valor por tipo.
- Alternativas: modificar el componente compartido de columnas o añadir un resumen
  exclusivo en la página de movimiento.
- Decisión: añadir el resumen solo en `CapturaPage.vue`, calculado a partir de los
  paquetes del movimiento y de su propio precio por tipo.
- Motivo: limitar el cambio a la pantalla solicitada y reutilizar `costoPaquete`,
  `formatPeso` y `soles` para conservar unidades y redondeo por paquete.
- Compatibilidad: sin cambios de datos, migraciones o dependencias. Los históricos
  sin pesos individuales conservan su presentación actual; no se inventa un desglose.

| Comprobación           | Resultado y evidencia                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript             | `npm run typecheck`: correcto, código 0                                                                                                    |
| ESLint                 | Ejecutado sobre `CapturaPage.vue`: correcto                                                                                                |
| Formato                | Prettier y `git diff --check`: correctos                                                                                                   |
| Compilación            | `npm run build:pwa`: correcta, código 0                                                                                                    |
| Compra en navegador    | Playwright/Edge, datos aislados: dos Rosados de 10.01 kg a S/ 0.50/kg suman 20.02 kg y S/ 10.02; Pardo a precio cero; Jumbo sin precio     |
| Precio posterior       | Jumbo de 30.25 kg cambia de «Sin precio» a S/ 60.50 al asignar S/ 2.00/kg en la compra terminada                                           |
| Venta en navegador     | Los mismos pesos usan precios propios de venta: Rosado S/ 10.01, Pardo S/ 41.00 y Jumbo S/ 90.75; persisten después de terminar y recargar |
| Pantalla móvil y temas | Anchos 360 y 390, claro y oscuro, sin desbordamiento horizontal; capturas `test-results/totales-compra-*.png`                              |
| Errores JavaScript     | Ninguno durante la comprobación en navegador; script terminó con código 0                                                                  |
| Paquete Netlify        | Actualizado `dist/transporteapp-netlify.zip` con la nueva compilación                                                                      |

| Criterio                                             | Estado                                   |
| ---------------------------------------------------- | ---------------------------------------- |
| Peso y valor por tipo en compra y venta              | Cumplido localmente                      |
| Funciona durante captura y en movimientos terminados | Cumplido localmente                      |
| Precios ausentes diferenciados de precio cero        | Cumplido localmente                      |
| Resto de pantallas y exportaciones conservado        | Sin cambios en sus archivos ni contratos |
| Comprobación en el hosting publicado                 | Pendiente de subir la nueva versión      |

- Siguiente paso: publicar `dist/pwa` o el ZIP actualizado en Netlify.
- No se hizo despliegue, commit, push ni operaciones remotas.

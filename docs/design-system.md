# Sistema de diseño — Transporte KSM

Fecha: 23 de octubre de 2026. Stack: Quasar, Vue 3 y TypeScript, PWA.
Estado: sistema, tokens y primera mejora de UI aplicados; auditoría inicial y resultados de validación registrados.

## Alcance y decisión

- Contexto: chofer, celular de 360–420 CSS px, una mano, camión y luz solar fuerte.
- Prioridad: velocidad de captura, legibilidad y precisión táctil.
- La solicitud posterior «ahora si aplica o termina lo que quedo pendiente» autoriza guardar este documento y aplicar los tokens previamente propuestos.
- Archivos de implementación: [quasar.variables.scss](../src/css/quasar.variables.scss) y [app.css](../src/css/app.css).
- Se mantienen flujo, distribución y eventos del teclado, cantidad de toques, autocompletado y registro automático.
- Se conservan columnas de diez registros con subtotal, orden de captura, últimas dos columnas durante captura y «Ver todas».
- La primera etapa aplicó tokens. La mejora posterior adapta componentes Vue y estilos, sin modificar dominio, repositorios, sincronización ni rutas. No se añaden dependencias de UI.

Decisión: dirección utilitaria, plana y de alto contraste. Se mantienen Roboto y Material Icons ya incluidos, y los componentes Quasar existentes. Alternativas descartadas: fuentes nuevas, bibliotecas de UI, efectos y cambios de interacción. Consecuencia: los estilos locales con valores fijos siguen siendo deuda visible en la auditoría; definir tokens no corrige automáticamente todas las pantallas.

## Dirección de estilo

Superficies sólidas, jerarquía por tamaño, peso, espacio y bordes visibles. Sin degradados, sombras decorativas, transparencias decorativas ni desplazamientos al pulsar.
Modo claro como opción inicial de trabajo exterior, oscuro seleccionable. La preferencia de tema existente se conserva.
No ocultar información operativa para acomodar efectos. En pantallas bajas, reducir decoración y espacio sobrante antes que objetivos táctiles o texto.

## Paleta

Cada par indica texto / fondo. No separar los pares sin volver a comprobar contraste.

| Uso                   | Claro             | Oscuro            |
| --------------------- | ----------------- | ----------------- |
| Página                | #111827 / #F3F4F6 | #F9FAFB / #111827 |
| Superficie            | #111827 / #FFFFFF | #F9FAFB / #1F2937 |
| Superficie secundaria | #374151 / #F3F4F6 | #D1D5DB / #293548 |
| Acción principal      | #FFFFFF / #124D94 | #111827 / #A8CEFF |
| Rosado                | #9D174D / #FCE7F3 | #F9A8D4 / #431B32 |
| Pardo                 | #713F12 / #FEF3C7 | #FCD68A / #3E2C16 |
| Jumbo                 | #115E59 / #CCFBF1 | #80E5D7 / #123D3A |
| Éxito / ganancia      | #166534 / #DCFCE7 | #86EFAC / #153323 |
| Error / pérdida       | #991B1B / #FEE2E2 | #FCA5A5 / #451A1A |
| Advertencia           | #854D0E / #FEF3C7 | #FDE68A / #422F12 |
| Borde de control      | #64748B           | #94A3B8           |
| Estado pulsado neutro | #111827 / #DBEAFE | #F9FAFB / #334155 |
| Deshabilitado         | #374151 / #E5E7EB | #D1D5DB / #374151 |

Objetivo: contraste de texto operativo de 7:1 cuando sea posible; mínimo 4,5:1 para texto normal y 3:1 para límites de controles y estados significativos. El tamaño mínimo táctil de 48 CSS px es un requisito de este producto.

### Semántica redundante

- Tipos: R · Rosado, P · Pardo, J · Jumbo. Mantener siempre letra y nombre, además del color.
- Selección: borde de 2 px, indicador visible y estado accesible seleccionado/pulsado.
- Resultados: «Ganancia +S/…», «Pérdida −S/…» y «Sin variación S/ 0,00». No depender del verde o rojo.
- Avisos: icono y texto explícito. No reutilizar Pardo como significado de advertencia.
- Último registro: marca persistente además del texto «Último». La animación es opcional y complementaria.

### Contrastes calculados de la propuesta

Cálculo de luminancia relativa sRGB, sin transparencia. No equivale a una medición de la pantalla al sol.

| Par                                      |   Claro |  Oscuro |
| ---------------------------------------- | ------: | ------: |
| Texto / superficie                       | 17,74:1 | 14,05:1 |
| Texto secundario / superficie secundaria |  9,37:1 |  8,40:1 |
| Texto / acción principal                 |  8,35:1 | 10,93:1 |
| Rosado                                   |  6,71:1 |  8,03:1 |
| Pardo                                    |  7,79:1 |  9,59:1 |
| Jumbo                                    |  6,73:1 |  8,04:1 |
| Borde / superficie secundaria            |  4,32:1 |  4,83:1 |

## Tipografía y dimensiones

Roboto existente; no descargar otra fuente. Números tabulares y alineados a la derecha para pesos, precios, cantidades, subtotales y resultados. Pesos siempre con dos decimales. Mantener el punto decimal del teclado actual.

| Elemento                                  | Tamaño / interlineado |    Peso |
| ----------------------------------------- | --------------------- | ------: |
| Peso en captura                           | 48 / 56 px            |     700 |
| Dígitos del teclado                       | 28 / 32 px            |     600 |
| Total principal                           | 24 / 32 px            |     700 |
| Título de pantalla                        | 24 / 32 px            |     700 |
| Texto, campos, botones, pesos registrados | 16 / 24 px            | 400–600 |
| Ayuda, estado, etiquetas auxiliares       | 14 / 20 px            | 400–600 |

- Números: `font-variant-numeric: tabular-nums lining-nums`.
- Ceros autocompletados: color secundario opaco, sin reducir opacidad.
- Espaciado: 4, 8, 12, 16, 24 y 32 px. Margen lateral: 16 px. Separación entre controles: 8 px.
- Radios: 4 px para controles y 8 px para tarjetas.
- Objetivo táctil real: mínimo 48 × 48 px; preferido 56 px de alto para teclado y acción principal.
- Icono: 24 px dentro de objetivo de 48 × 48 px. El tamaño visual no define el área táctil.
- Columnas: ancho inicial de 112 px, diez registros y subtotal; permitir desplazamiento horizontal para «Ver todas».
- Las celdas solo de lectura pueden medir menos de 48 px de alto. Los pesos pulsables deben cumplir el mínimo.

## Distribución y estados

Mantener tipo seleccionado, display, último peso y teclado visibles durante la captura. Reservar una región estable bajo el display para mensajes, dimensionada con los textos reales; evitar contenedores diminutos con scroll y superposición de mensajes.

Las barras inferiores respetan `env(safe-area-inset-bottom)`. El contenido reserva su altura efectiva. Verificar que el teclado del sistema para nombres y precios no tape el campo activo ni la acción principal.

Foco: contorno de 3 px, separado 3 px. Respuesta inmediata al pulsar sin mover controles ni cambiar dimensiones. Deshabilitados con semántica nativa; explicar por qué no se puede avanzar. Los errores de captura permanecen inline, sin nuevos modales. Respetar movimiento reducido.

## Contrato de tokens y Quasar

Los valores de compilación están en [quasar.variables.scss](../src/css/quasar.variables.scss). Los temas y variables de producto están en [app.css](../src/css/app.css), ya incluido por la configuración existente.

| Grupo           | Tokens                                                            |
| --------------- | ----------------------------------------------------------------- |
| Superficies     | --ksm-surface, --ksm-card, --ksm-soft                             |
| Texto y límites | --ksm-text, --ksm-muted, --ksm-border                             |
| Acción          | --ksm-primary, --ksm-on-solid                                     |
| Estados         | --ksm-positive, --ksm-negative, --ksm-warning y sus variantes -bg |
| Tipos           | --egg-r, --egg-p, --egg-j y sus variantes -bg                     |
| Interacción     | --ksm-pressed, --ksm-disabled-bg, --ksm-disabled-text             |
| Espacio         | --ksm-space-1/2/3/4/6/8                                           |
| Forma           | --ksm-radius-control, --ksm-radius-card                           |
| Medidas         | --ksm-touch-min, --ksm-key-height, --ksm-column-width             |
| Tipo            | --ksm-font-body/small/title/key/display                           |

Los alias --q-primary/secondary/accent/positive/negative/info/warning se resuelven sobre body para reaccionar a body--light/body--dark. Los controles Quasar sólidos con colores de marca usan --ksm-on-solid: blanco en claro y oscuro en oscuro. No aplicar esta inversión a botones flat u outline. Para superficies suaves de estado, usar las clases ksm-status-positive/negative/warning con su par completo.

Utilidades disponibles: ksm-number, ksm-touch, ksm-key y ksm-solid. Las utilidades nuevas necesitan asignarse a componentes en una adaptación futura; no implican que todas las pantallas ya las consuman. No se añade una regla universal con !important para cambiar medidas locales y arriesgar el teclado existente.

| Necesidad            | Componente o regla                                           |
| -------------------- | ------------------------------------------------------------ |
| Teclas y acciones    | QBtn, no-caps, unelevated; conservar orden y manejadores     |
| Tipos / granjas      | QBtn, nombre visible, borde e indicador, aria-pressed        |
| Campos               | QInput outlined, 48–56 px, texto de 16 px                    |
| Calendario           | QBtn de 48 × 48 px con QPopupProxy y QDate existentes        |
| Parte del movimiento | Mantener QSelect y creación actual; opciones de 48 px        |
| Checkbox             | QCheckbox, toda la etiqueta pulsable y objetivo de 48 px     |
| Avisos               | QBanner con icono y par semántico por tema                   |
| Tarjetas             | QCard flat bordered                                          |
| Disponibles          | Mantener QVirtualScroll y ajustar item-size si cambia altura |
| Pesos en columnas    | Mantener ColumnasPesos y agrupación de diez                  |

Reiniciar el servidor de desarrollo después de crear quasar.variables.scss. No introducir Tailwind, otra UI ni bibliotecas de validación por recomendaciones genéricas.

## Auditoría de las pantallas actuales

Auditoría estática del código inspeccionado. P1 afecta lectura, precisión o velocidad; P2 afecta consistencia o comprensión. El orden dentro de cada pantalla indica prioridad. Los hallazgos describen estilos locales y comportamiento observados antes de adaptar pantallas; aplicar tokens no los da por corregidos.

### Inicio

Referencia: [Inicio](<../src/pages/index/(index).vue>) y [EstadoRespaldo](../src/components/EstadoRespaldo.vue).

| Prioridad | Problema observado                                                             | Corrección propuesta                                     |
| --------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| P1        | Tres métricas con números de ~17 px, etiquetas de ~12 px y unidades de ~11 px  | Escala común y comprobar pesos largos sin encoger fuente |
| P1        | Respaldo con altura local de 36 px y texto de 11 px, anulando el mínimo global | 48 px y texto de 14 px                                   |
| P1        | Historial con div y @click, sin semántica de navegación por teclado            | QItem clickable, mismo destino y mismo toque             |
| P2        | Continuar viaje usa degradado, sombra y desplazamiento al hover                | Fondo sólido y estado estable                            |
| P2        | Stock por tipo no reutiliza identificadores visuales de captura                | R/P/J, nombre y tokens comunes                           |

### Detalle de viaje

Referencia: [ViajePage](../src/modulos/viajes/pages/ViajePage.vue) y [MovimientoCard](../src/modulos/viajes/components/MovimientoCard.vue).

| Prioridad | Problema observado                                                                       | Corrección propuesta                             |
| --------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ |
| P1        | Nuevo usa texto blanco sobre degradado #22C55E–#16A34A: 2,28:1–3,30:1 en sus extremos    | Par de acción principal                          |
| P1        | QInput de búsqueda dense sin mínimo explícito de 48 px                                   | Altura real mínima de 48 px                      |
| P1        | Apertura de movimiento depende de QBtn round dense size=sm; mínimo global solo de altura | Asegurar área de 48 × 48 px                      |
| P1        | Estado En curso: #0284C7 / #E0F2FE, 3,57:1 en texto pequeño                              | Par de texto accesible                           |
| P2        | Exportaciones compiten visualmente con la lista operativa                                | Reducir énfasis conservando ubicación y acciones |
| P2        | Métricas pequeñas sin tabular-nums explícito                                             | Escala común y números tabulares                 |

### Nuevo movimiento: compra y venta

Referencia: [CompraPage](../src/modulos/viajes/pages/CompraPage.vue), [VentaPage](../src/modulos/viajes/pages/VentaPage.vue) y [MovimientoTypeToggle](../src/modulos/viajes/components/MovimientoTypeToggle.vue).

| Prioridad | Problema observado                                                          | Corrección propuesta                                                    |
| --------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| P1        | Calendario activado por QIcon de 18 px                                      | QBtn de 48 × 48 px con nombre accesible, mismo popup                    |
| P1        | Campos de precio con contenedor de 46 px                                    | 48–56 px reales                                                         |
| P1        | Labels de fecha y precio sin asociación for/id                              | Asociar etiquetas o usar QInput                                         |
| P1        | Acción principal blanca sobre degradado verde de bajo contraste             | Par de acción principal                                                 |
| P1        | Tres precios col-4 con etiquetas ellipsis y poco espacio a 360 px           | R/P/J con nombre y unidad en línea separada, sin cambiar flujo          |
| P1        | Checkbox dense sin área mínima explícita de etiqueta                        | Área completa de al menos 48 px                                         |
| P2        | Selector de operación con clase y sombra, sin estado accesible de selección | Borde, indicador y estado accesible                                     |
| P2        | Barra fija desplazada por un valor constante de 64 px                       | Verificar área segura, teclado del sistema y reserva de altura efectiva |

### Captura

Referencia: [CapturaPage](../src/modulos/viajes/pages/CapturaPage.vue), [TecladoPesos](../src/components/TecladoPesos.vue) y [ColumnasPesos](../src/components/ColumnasPesos.vue).

| Prioridad | Problema observado                                                                    | Corrección propuesta                                                  |
| --------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| P1        | Media query max-height:800px reduce teclas a 44 px y prevalece sobre el mínimo global | No bajar de 48 px                                                     |
| P1        | Deshacer 40 px, granjas 42 px, resumen de ajustes 28 px y etiquetas 40 px             | Objetivos de 48 px                                                    |
| P1        | Ceros autocompletados con opacity:0.5                                                 | Texto secundario opaco                                                |
| P1        | Último peso y mensajes de 11 px, región de 38–42 px y mensaje con scroll interno      | Texto legible y región estable probada con avisos reales              |
| P1        | Columnas con pesos y subtotal de 12 px, índices de 8 px y resumen de 10 px            | Ampliar tipografía sin cambiar diez filas ni subtotal                 |
| P1        | Teclado en scroll normal bajo cabecera y granjas; cierre fijo                         | Verificar todas las teclas visibles y alcanzables en alturas pequeñas |
| P2        | Última celda usa destello temporal, sin marca visual persistente                      | Marca Último además de la línea ya existente                          |
| P2        | Tipo seleccionado depende visualmente de color y borde                                | R/P/J e indicador, conservar aria-pressed                             |
| P2        | Estado pulsado del teclado usa #DBEAFE fijo también en oscuro                         | Par de estado pulsado por tema                                        |

### Cierre

Referencia: [CierrePage](../src/modulos/viajes/pages/CierrePage.vue) y [ResultadoGanancia](../src/components/ResultadoGanancia.vue).

| Prioridad | Problema observado                                           | Corrección propuesta                                       |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| P1        | Tabla global a 0.8rem, sin números tabulares explícitos      | 16 px, tabulares y alineación común                        |
| P1        | Cuatro columnas con títulos e importes largos a 360 px       | Verificar lectura horizontal y mantener Tipo identificable |
| P1        | Avisos bg-red-1/bg-amber-1 fijos de tema claro               | Pares semánticos completos en ambos temas                  |
| P2        | Resultado negativo conserva el título Ganancia; ya hay signo | Pérdida y Sin variación como etiquetas explícitas          |
| P2        | Tipos sin identificadores visuales comunes                   | R/P/J, nombre y color                                      |

## Uso verificado del skill

Se leyó ui-ux-pro-max/SKILL.md. Python 3.14.7 instalado por petición explícita del usuario. El validador del skill comprobó 12 dominios, 22 stacks y ui-reasoning.csv.

Consultas ejecutadas: «touch target mobile» en ux, «forms» en vue y generación de sistema con «logistics data entry accessible mobile», seguida de una reformulación «data entry tool minimal».

La búsqueda UX devolvió recomendaciones pertinentes de tamaño y separación. El generador incluyó patrones de landing y tipografías editoriales; tras reformular, siguió proponiendo una landing. Esas partes no son una coincidencia verificada para captura móvil y no se adoptan. Las recomendaciones Vue de otras bibliotecas tampoco se adoptan. El sistema final es una adaptación explícita a los requisitos del usuario y al código Quasar, usando la guía general del skill y contrastes calculados.

## Mejora de UI aplicada

Se priorizó visibilidad y simplicidad sobre decoración, por petición explícita del usuario. La auditoría anterior se conserva como diagnóstico previo; esta sección indica lo implementado después.

| Área               | Cambio aplicado                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Captura            | Cabecera compacta con nombre y operación; asignación de precios y fecha junto al comprobante durante captura. Mismas acciones, sin pasos nuevos.            |
| Teclado            | Dígitos de 28 px, display de 48 px, teclas de 48 px en pantallas bajas y 56 px en las demás, separación de 8 px. Se conserva el script completo de captura. |
| Verificación       | Último peso y mensajes de 14 px, región de al menos 100 px sin recorte ni scroll interno; los textos excepcionalmente largos pueden ampliar esa región.     |
| Tipos              | R/P/J, nombre, color, borde y subrayado del tipo seleccionado; contadores de 14 px.                                                                         |
| Columnas           | Diez registros y subtotal intactos; números tabulares de 16 px, ancho de 112 px, marca persistente del último peso.                                         |
| Inicio y Detalle   | Métricas en filas, números de 24 px, etiquetas de 16 px y unidades de 14 px.                                                                                |
| Acciones           | Botones principales sólidos; eliminación de sombras decorativas y desplazamientos.                                                                          |
| Nuevo movimiento   | Calendario mediante QBtn de 48 px, etiquetas asociadas a campos, texto de 16 px y campos de al menos 48 px.                                                 |
| Respaldo y precios | Controles de al menos 48 px, texto ampliado y colores del tema.                                                                                             |
| Cierre y resultado | Tablas de 16 px con números tabulares y primera columna fija; avisos adaptados al tema; etiquetas Pérdida / Ganancia / Sin variación.                       |

Archivos de UI: app.css, TecladoPesos.vue, ColumnasPesos.vue, CapturaPage.vue, EstadoRespaldo.vue, MovimientoTypeToggle.vue, ResultadoGanancia.vue, PreciosMovimiento.vue, CompraPage.vue y VentaPage.vue. También se ampliaron las pruebas E2E existentes relacionadas con la UI.

La consulta adicional «readable text contrast» en el dominio ux devolvió reglas pertinentes de contraste, tamaño mínimo de texto móvil y lectura de texto secundario. Se aplicaron al contexto de captura; no se añadieron bibliotecas ni fuentes.

## Validación y límites

| Comprobación                                                                    | Comando o procedimiento                                    | Resultado                                                                        |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Formato                                                                         | Prettier --check con rutas explícitas                      | Aprobado                                                                         |
| Tipos                                                                           | npm run typecheck                                          | Aprobado                                                                         |
| Compilación PWA, SCSS y service worker                                          | npm run build:pwa                                          | Aprobado                                                                         |
| Flujo móvil, offline, exportaciones, remanentes, rendimiento, PDF y uniformidad | npm run test:e2e                                           | 4 pruebas aprobadas                                                              |
| Teclado: autocompletado y cuatro toques                                         | npm test -- src/components/TecladoPesos.test.ts            | 1 prueba aprobada                                                                |
| Tamaños y encaje del teclado de compra                                          | Prueba existente ampliada a 360/390/420 px, claro y oscuro | Objetivos >=48 × 48 px; todas las teclas sobre la barra; sin overflow horizontal |
| Venta compacta                                                                  | Comprobaciones existentes a 360 × 780 px en oscuro         | Acción Marcar sobre la barra; sin overflow horizontal                            |
| Botón principal sólido                                                          | Prueba de Inicio                                           | Sin background-image ni box-shadow                                               |
| Inspección visual final                                                         | Capturas de Inicio y venta oscura a 360 px                 | Revisadas                                                                        |
| Contrastes de la paleta                                                         | Cálculo sRGB de los pares documentados                     | Valores indicados en la tabla                                                    |
| Contrato AppButton/AppCard                                                      | npm run check:ui y node --test scripts/check-ui.test.mjs   | Guard y 5 casos aprobados                                                        |
| Uniformidad en claro/oscuro                                                     | Playwright, 390 × 844                                      | Grupos, ancho, altura, cards y overflow aprobados                                |

Se preservaron los cambios locales previos. No se modificaron dominio, repositorios, sincronización, rutas, dependencias ni lógica de captura. Las pruebas de dominio o sincronización no se ejecutaron por no cambiar esas capas.

La compilación y TypeScript emiten un aviso de vue-router sobre rootDir, sin impedir su aprobación. No se cambió la configuración del router.

Pendiente: prueba exterior con una mano y luz solar fuerte; zoom/texto ampliado; nombres y mensajes excepcionalmente largos; teclado del sistema y áreas seguras en dispositivos físicos. La matriz de seis casos automatizados corresponde al teclado de compra, no certifica todas las pantallas en todos los tamaños. Se conserva la auditoría de aspectos fuera de esta mejora, como semántica del historial y otras acciones secundarias.

## Fuentes técnicas

- [Quasar: variables Sass/SCSS](https://quasar.dev/style/sass-scss-variables/)
- [Quasar: paleta y colores de marca](https://quasar.dev/style/color-palette/)
- [Quasar: modo oscuro](https://quasar.dev/style/dark-mode/)
- [Especificación local de negocio y UX](ai/especificacion/negocio-y-ux.md)

## Contrato común de botones y tarjetas

- `AppButton` es el único dueño de `QBtn` de producto. Acepta tamaños `md` (48 px) y `lg` (56 px), variantes `primary`, `secondary`, `ghost` y `danger`, y ancho automático o `block`. El texto, peso, radio y estados disabled/loading se mantienen iguales entre variantes del mismo tamaño.
- `AppButtonRow` organiza acciones con el mismo espacio y altura. Usa columnas iguales o proporción 2:1 para acción principal/secundaria; mide etiquetas y las apila cuando no caben. Las barras fijas respetan el área segura inferior.
- `AppCard` centraliza la superficie plana, borde de 1 px y radio de 8 px. El padding es 16 px o cero para tarjetas estructurales.
- Excepción: las teclas numéricas de `TecladoPesos` conservan su rejilla y botones nativos. Todas miden 56 px, o 48 px en pantallas bajas; no cuentan como botones de acción de la aplicación.
- Los componentes de captura, viaje, formularios, navegación, documentos y cierre usan estos wrappers. Las clases de presentación propias de botones se retiraron.
- `npm run check:ui` valida el contrato; forma parte de `npm run lint:check` y `npm run lint`. Sus casos de rechazo y excepción se prueban con `node --test scripts/check-ui.test.mjs`. Playwright cubre 390 × 844 en tema claro y oscuro.

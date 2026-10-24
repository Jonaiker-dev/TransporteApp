# Prompt para Cursor + GPT-6: PWA offline-first de transporte y venta de huevos (Chincha → Lima)

## Cómo usar este archivo en Cursor

1. Abre la carpeta raíz del proyecto en Cursor.
2. Copia `demo-pesos.html` a `docs/demo-referencia.html`. Es una referencia de UX y lógica, no código de producción.
3. Guarda la **Parte 0** como `AGENTS.md` en la raíz del repositorio. Cursor puede usarlo como contexto persistente para el agente. Si tu versión de Cursor utiliza reglas de proyecto, también puedes dividir las reglas estables en `.cursor/rules/`.
4. Mantén este archivo completo como `docs/plan-implementacion.md` para que el agente pueda consultar las 10 fases y sus criterios de aceptación.
5. Selecciona GPT-6 en el selector de modelos de Cursor si está disponible en tu cuenta. Las capacidades exactas dependen de la versión y configuración de Cursor.
6. Ejecuta **una fase por vez** en el modo de planificación de Cursor cuando esté disponible. Primero pide el plan, revísalo y después autoriza la implementación.
7. Al terminar una fase, exige que el agente ejecute los comandos reales de lint, typecheck y tests disponibles, revise el diff y reporte resultados. No permitas que declare pruebas exitosas si no las ejecutó.
8. No hagas commits automáticamente: primero revisa los cambios y autoriza el commit.

### Prompt inicial recomendado para el agente de Cursor

Lee `AGENTS.md`, `docs/plan-implementacion.md` y `docs/demo-referencia.html` si existen. Inspecciona el repositorio antes de modificarlo. Resume el estado actual, identifica riesgos y propón un plan concreto para la **Fase 1 solamente**. No escribas código hasta que apruebe el plan. Respeta las reglas de negocio y arquitectura del documento. No inventes archivos, dependencias, comandos ni resultados de pruebas.

Cuando apruebe el plan, implementa únicamente la fase autorizada, ejecuta las comprobaciones que correspondan y presenta un resumen con archivos modificados, comandos ejecutados, resultados reales, limitaciones y criterios de aceptación pendientes. Detente y espera mi confirmación antes de comenzar otra fase.

### Si el repositorio ya contiene código

No recrees ni sobrescribas el proyecto automáticamente. Primero inspecciona `package.json`, la estructura, los scripts, las migraciones y los cambios existentes. Conserva las decisiones compatibles con las reglas no negociables; antes de proponer una migración o refactor amplio, explica el motivo y el impacto.

---

# PARTE 0: CONTEXTO E INSTRUCCIONES PERMANENTES (para AGENTS.md)

## Reglas de trabajo para el agente (Cursor + GPT-6)

- Usa este documento como especificación funcional. La implementación existente del repositorio y los archivos de referencia deben inspeccionarse antes de decidir cambios.
- Trabaja solo en la fase solicitada y aprobada. No avances a fases posteriores por iniciativa propia.
- Antes de editar, resume el enfoque, los archivos que probablemente cambiarán, los riesgos y cómo validarás la fase. Si el usuario ya aprobó un plan para esa fase, procede sin volver a pedir la misma aprobación.
- No te limites a generar código: integra los cambios en el proyecto real, ejecuta las comprobaciones disponibles y corrige los errores introducidos por tus cambios.
- No afirmes que compiló, que los tests pasaron, que la PWA funciona offline o que Supabase está configurado si no lo verificaste con comandos o pruebas reales. Distingue claramente entre verificado, no ejecutado y bloqueado.
- Inspecciona `package.json` antes de asumir scripts o instalar dependencias. Prefiere las dependencias ya presentes. Justifica cualquier dependencia nueva.
- No reemplaces archivos completos ni hagas refactors ajenos a la fase si no es necesario. Respeta los cambios locales del usuario y no reviertas cambios que no hayas creado.
- No ejecutes comandos destructivos, migraciones remotas, despliegues, cambios de infraestructura ni operaciones que puedan borrar datos sin autorización explícita.
- Nunca escribas secretos reales en el código, logs, documentación ni commits. Usa variables de entorno y proporciona un `.env.example` sin credenciales.
- Mantén el idioma de la interfaz en español, la moneda en soles (S/) y la zona horaria `America/Lima`.
- En cada fase, compara la implementación con todos los criterios de aceptación de esa fase y reporta cuáles están cumplidos, pendientes o bloqueados.
- No hagas commit, push ni despliegue sin autorización explícita del usuario.

## Negocio
Empresa con 1 camión y 1 chofer que cubre la ruta Chincha → Lima. Compra jabas de huevo en granjas (por kg, precio variable por día y por tipo) y las vende en Lima a un precio mayor. Casi nunca hace fletes para terceros, pero debe poder registrarlos. Hoy todo se lleva en cuadernos escritos a mano. El dolor principal es el tiempo perdido anotando pesos. La prioridad absoluta del MVP es **reducir el tiempo de captura de pesos**.

- Tipos de huevo: Rosado (R), Pardo (P), Jumbo (J).
- Un "paquete" es una jaba con huevos. Siempre se vende por kg. Cada paquete trae una etiqueta con su peso (ya tareado). Los pesos siempre se manejan con **2 decimales**.
- Se compran cientos de paquetes por viaje (~1500 por viaje).
- Al vender en Lima se bajan paquetes del apilado del camión según los van teniendo a mano, de una o varias granjas. El vendedor sabe de qué granja es lo que está entregando.
- Muchas veces no se vende todo: lo que sobra se queda en el camión para el siguiente viaje.

## Stack
- Quasar (Vite, Vue 3, Composition API, `<script setup>`, **TypeScript**) en modo PWA.
- Dexie (IndexedDB) como base local y **fuente de verdad**. No hay una segunda IndexedDB aparte.
- Supabase (Postgres + Auth) solo como respaldo mediante sincronización de un solo sentido (push) en el MVP.
- Exportación en cliente: pdfmake (PDF) y ExcelJS (Excel, con fórmulas reales para los subtotales).
- Pruebas: Vitest para lógica pura; Playwright opcional al final.
- Interfaz en español. Moneda: soles (S/). Zona horaria: America/Lima.

## Arquitectura (reglas no negociables)
1. **La UI nunca lee de Supabase.** Solo de Dexie, a través de repositorios.
2. Capas: `pages/components` → `composables` → `repositories` (única capa que toca Dexie) → `sync` (única capa que toca Supabase). La lógica de dominio vive en `domain/` como **funciones puras sin dependencias de UI ni de Dexie**.
3. Todos los IDs son **UUID v4 generados en el cliente**.
4. Toda tabla lleva `id, created_at, updated_at, deleted_at (borrado lógico), synced_at`. Todo cambio se escribe en Dexie y se encola en `sync_queue` **en la misma transacción**.
5. **Los pesos se guardan como enteros en centésimas de kg** (`peso_c`: 21.45 kg = 2145) para evitar errores de coma flotante. Se convierten a decimal solo para mostrar.
6. Todo debe funcionar sin red, incluida la exportación a PDF/Excel.
7. Solo un viaje puede estar abierto a la vez (validar dentro de una transacción en el repositorio).

## Modelo de datos (Dexie)
- `viajes`: id, fecha_inicio, fecha_fin|null, estado (`ABIERTO`|`CERRADO`), nota.
- `partes` (clientes, granjas, dueños de flete): id, nombre, nombre_norm (minúsculas sin tildes, para buscar), roles[] (`CLIENTE`|`GRANJA`|`FLETE`). Se crean "al vuelo" solo con el nombre.
- `movimientos`: id, viaje_id, tipo (`COMPRA`|`VENTA`|`FLETE`), fecha, parte_id, precios {R,P,J} en centésimas de sol por kg (opcionales), tiene_pesos_compra (bool, solo VENTA), estado (`EN_CURSO`|`TERMINADO`).
- `paquetes` (un registro por jaba): id, tipo, peso_c, granja_id|null, compra_mov_id|null, venta_mov_id|null, estado (`EN_CAMION`|`EN_VENTA`|`VENDIDO`), origen (`COMPRA`|`VENTA_SIN_COMPRA`), orden_captura (secuencia entera, define el orden de las columnas).
- `flete_lineas`: id, movimiento_id, tipo, cantidad.
- `sync_queue`: seq autoincremental, tabla, entidad_id, operacion, intentos, ultimo_error.
- Índices clave de `paquetes`: `[estado+tipo+granja_id]`, `compra_mov_id`, `venta_mov_id`.
- El inventario pertenece al **camión**, no al viaje: un paquete `EN_CAMION` de un viaje anterior sigue disponible en el siguiente.

## Reglas de dominio

**Teclado numérico propio (nunca el del sistema para pesos)**
- Teclas 0-9, punto decimal, borrar un dígito, limpiar, "Agregar" (compra) o "Marcar" (venta), y "Deshacer último".
- Se escribe con punto decimal y se **autocompleta a 2 decimales**: `12.4` → `12.40`, `12` → `12.00`. El display muestra lo escrito y los ceros que faltan en gris tenue.
- Opciones activadas por defecto y apagables: (a) poner el punto automáticamente tras 2 enteros, (b) agregar/marcar automáticamente al completar los 2 decimales. Con ambas, `2 1 4 5` = 21.45 en 4 toques.
- El tipo seleccionado se mantiene entre pesos. Colores distintos por tipo.
- Aviso (no bloqueante) si un peso se aleja más de 30% de la mediana del tipo (solo con 10 o más muestras). Vibración corta al registrar. Soporte de teclado físico en escritorio.
- Línea de verificación: "Último: 21.45 kg · Rosado".

**Vista en columnas de 10 (requisito explícito del cliente)**
- Los pesos se agrupan por tipo; cada tipo en columnas de 10 registros con el **subtotal de la columna debajo**, y total y cantidad por tipo y general. Orden = orden de captura.
- Es una **función pura** `groupColumns(paquetes, 10)` que alimenta pantalla, PDF y Excel. Un único componente la reutiliza en captura, detalle y exportación.
- Mientras se captura, mostrar solo las últimas 2 columnas por tipo, con opción "Ver todas".

**Compra en granja**
- Cada peso crea un paquete `EN_CAMION` con `granja_id` = la parte del movimiento de compra y `compra_mov_id`.

**Venta con pesos de compra registrados (check en el formulario)**
- La venta **cambia el estado de paquetes existentes**; no crea registros nuevos.
- Siempre hay **una granja seleccionada** (no existe la opción "Todas"). Por defecto, la primera con stock; se puede cambiar con botones que muestran el stock por granja.
- Al escribir los 2 decimales, el paquete con ese peso exacto, del tipo y la granja elegidos, se marca solo (`EN_VENTA` con `venta_mov_id`). Mientras se teclea, la lista de disponibles se filtra por prefijo del peso.
- **Duplicados** (mismo peso, mismo tipo, misma granja): se toma el de la compra más antigua (FIFO por `compra_mov.fecha`, luego `orden_captura`). En la lista aparecen agrupados como `12.90 ×2`. Al marcar un repetido se avisa: "Ya van N de 12.90 kg en esta venta · quedan M".
- Si no hay coincidencia, el mensaje debe distinguir 3 casos: (1) ya se marcaron todos en esta venta, (2) ya se vendieron en otro movimiento, (3) no existe en esa granja y tipo (indicando si existe en otra granja).
- La lista de disponibles muestra máximo 60 elementos y usa virtualización. Hay una sección "Marcados en esta venta" (últimos 8) para tocar y desmarcar.
- `EN_VENTA` pasa a `VENDIDO` solo al **terminar el movimiento**. Si se cancela el movimiento, los paquetes vuelven a `EN_CAMION`.

**Venta sin pesos de compra (check desmarcado)**
- La captura funciona como la de compra (el teclado agrega). Cada peso crea un paquete con `origen = VENTA_SIN_COMPRA`, `granja_id = null`, `compra_mov_id = null`, `venta_mov_id` = el movimiento. Al terminar, `VENDIDO`.
- Estos paquetes no tienen costo conocido y se excluyen de la ganancia con una nota visible.

**Flete**
- Líneas simples `{tipo, cantidad}` por cliente. Sin pesos. Debe poder consultarse y buscarse por cliente.

**Viajes**
- Se inicia manualmente. Solo uno abierto a la vez.
- **No se cierran solos.** Si un viaje lleva 3 o más días abierto, el inicio muestra un aviso (recordatorio, nunca cierre automático).
- Para cerrar: no puede haber movimientos `EN_CURSO`. La pantalla de cierre muestra el cuadre por tipo (comprado, vendido, quedan) y el resultado por tipo (venta, costo, ganancia). Lo que queda sigue en el camión para el siguiente viaje.
- Un viaje cerrado puede reabrirse solo si no hay otro abierto.

**Ganancia**
- **Ganancia realizada** = ingresos − costo de lo vendido. Costo de un paquete = `peso × precio de compra por kg` del movimiento de compra de ese paquete. Ingreso = `peso × precio de venta por kg` del movimiento de venta.
- Lo no vendido nunca se cuenta como pérdida: se muestra aparte como "En camión, a costo". Su resultado se reconoce en el viaje donde se venda.
- Paquetes sin precio de compra o de venta quedan fuera del cálculo, con la nota "N paq. sin precio… no entran en la ganancia".
- Es ganancia bruta. Gastos operativos (combustible, peajes) quedan fuera del MVP.
- Funciones puras: `costoPaquete`, `ganancia(items, precios)`, `costoPromedio(tipo)`. Muestran % sobre costo.

**Pantalla de inicio (móvil)**
- Chip de estado de respaldo ("Todo respaldado" / "N cambios sin respaldar"; al tocarlo, sincroniza).
- Tarjeta del viaje en curso: día N, comprado / vendido / en camión (kg y paquetes), vendido en S/, ganancia realizada, en camión a costo, botón "Continuar viaje" y atajos "+ Compra" y "+ Venta". Sin viaje: botón "Iniciar viaje".
- Aviso de viaje largo, movimientos pendientes de terminar, "En el camión ahora" por tipo, últimos movimientos, viajes anteriores con su ganancia.

**Flujo de pantallas**
Inicio → Detalle de viaje (lista de movimientos, "Nuevo movimiento", "Cerrar viaje") → Nuevo movimiento (tipo, fecha, parte con búsqueda y "Crear «texto»", precios, check de pesos) → Captura. Al tocar la card de un movimiento en curso se vuelve a su captura. Barra inferior fija con totales y botón de confirmar ("Confirmar venta" / "Terminar compra").

## UX móvil (diseño mobile-first, 360-420 px)
- Botones táctiles de al menos 48 px; acciones principales en la zona del pulgar; barras inferiores respetan `safe-area-inset-bottom`.
- Teclado propio con teclas grandes; el layout no debe moverse al teclear.
- Soporte de modo claro y oscuro. Alto contraste (se usa al aire libre).
- Los mensajes de error de captura van en una línea fija bajo el display, nunca en modales.

## Sincronización (MVP: solo push)
- Cola `sync_queue` procesada en lotes de 200, con **upsert idempotente por id** hacia Supabase. Reintentos con backoff exponencial. Agrupar los cambios por movimiento.
- Disparadores: evento `online`, al abrir la app, botón manual. **No depender de Background Sync** (no es confiable en iOS).
- Llamar a `navigator.storage.persist()` y guiar a instalar la PWA. Ofrecer exportar un respaldo JSON local del viaje.
- Supabase Auth (email y contraseña). La app **debe funcionar sin sesión válida**: acumula la cola y sincroniza cuando se pueda reautenticar. Activar RLS en todas las tablas desde el inicio.

## Fuera del MVP
Lector de código de barras, voz, OCR de etiquetas, multiusuario, pull/sync bidireccional, pagos y cobranza, panel web de administración, gastos operativos, ganancia neta, estimación de costo para ventas sin compra.

## Convenciones
- Estructura: `src/domain` (puro), `src/db` (Dexie y esquema), `src/repositories`, `src/sync`, `src/composables`, `src/components`, `src/pages`, `src/utils`, `docs/`.
- Cada módulo de `domain/` tiene tests de Vitest. Los repositorios tienen tests con `fake-indexeddb`.
- Commits pequeños, uno por fase. No introducir dependencias nuevas sin justificarlas.
- Antes de dar una fase por terminada: ejecutar los scripts disponibles de `lint`, `typecheck` y tests; reportar resultados reales y dejar explícitos los bloqueos. No hacer commit sin autorización.

---

## Plantilla para solicitar cada fase en Cursor

Copia este mensaje y cambia el número de fase:

> Implementa únicamente la Fase N de `docs/plan-implementacion.md`.
> Lee primero `AGENTS.md`, la fase completa y el estado actual del repositorio.
> Si todavía no aprobé el plan de esta fase, entrega primero un plan y espera mi aprobación sin editar archivos.
> Después de la aprobación, implementa la fase de forma incremental, respeta las reglas no negociables, ejecuta lint/typecheck/tests disponibles y corrige los errores causados por tus cambios.
> Al finalizar, informa: resumen, archivos modificados, comandos ejecutados y resultados, criterios de aceptación cumplidos/pendientes, riesgos o decisiones necesarias. No empieces otra fase y no hagas commit sin mi autorización.

---

# FASE 1: Base del proyecto, PWA, Dexie y dominio puro

**Objetivo:** esqueleto ejecutable, instalable y offline, con el modelo de datos y la lógica pura probada.

**Tareas**
1. Crear el proyecto Quasar (Vite, Vue 3, TypeScript) con modo PWA, ESLint y Prettier. Configurar el manifest (nombre, iconos, `display: standalone`, tema) y el service worker para precachear los assets y abrir sin red.
2. Definir los tipos TypeScript del modelo de datos de la Parte 0 y el esquema Dexie con sus índices. Migraciones versionadas.
3. Implementar repositorios para `viajes`, `partes`, `movimientos`, `paquetes`, `flete_lineas` con escritura transaccional + encolado en `sync_queue`. Incluir la regla "un solo viaje abierto".
4. Implementar en `domain/` las funciones puras con tests: `formatPeso` / `parsePeso` (centésimas ↔ texto con 2 decimales), `normalizarTeclado` (autocompletar `12.4` → `12.40`, punto automático tras 2 enteros), `groupColumns`, `ganancia`, `costoPaquete`, `medianaPorTipo` y `esOutlier`.
5. Layout base con tema claro/oscuro, router (Inicio, Viaje, Nuevo movimiento, Captura, Cierre) y pantallas vacías.

**Criterios de aceptación**
- La app se instala, abre sin red tras la primera carga y pasa Lighthouse PWA.
- Tests de dominio en verde, incluidos los casos de borde: `12`, `12.`, `12.4`, `0.5`, `100.25`.
- No hay `float` en el almacenamiento de pesos.

---

# FASE 2: Viajes y pantalla de inicio

**Objetivo:** inicio y gestión de viajes según las reglas de la Parte 0. Referencia visual: `docs/demo-referencia.html`.

**Tareas**
1. Pantalla de inicio con todos los bloques descritos (tarjeta del viaje, avisos, camión por tipo, últimos movimientos, viajes anteriores). Si no hay viaje, el botón "Iniciar viaje".
2. Detalle de viaje con KPIs y lista de movimientos (card con tipo, parte, fecha, paquetes, kg, estado).
3. Cierre de viaje: bloquear con movimientos en curso, cuadre por tipo, mensaje de que lo restante pasa al siguiente viaje, y reapertura cuando no hay otro abierto.
4. Aviso de "viaje largo" a los 3 o más días.
5. El chip de respaldo lee el conteo de `sync_queue` (por ahora solo lectura).

**Criterios de aceptación**
- Imposible tener dos viajes abiertos (probado a nivel de repositorio).
- Los KPIs se calculan desde Dexie y se actualizan sin recargar.
- Cerrar un viaje no altera el estado de los paquetes `EN_CAMION`.

---

# FASE 3: Formulario de nuevo movimiento

**Tareas**
1. Selector de tipo (Venta / Compra, Flete como opción deshabilitada hasta la fase 10), fecha y precios por kg para R, P, J.
2. Campo de parte con `q-select` con búsqueda (usar `nombre_norm`) y opción final **"Crear «texto»"** que crea la parte al vuelo con solo el nombre y le asigna el rol según el contexto (granja en compra, cliente en venta).
3. En Venta, el check **"¿Tienes registrados los pesos de la compra?"** (activado por defecto) con su texto de ayuda.
4. En Venta, bajo cada precio, mostrar "costo ≈ X /kg" usando `costoPromedio` del stock actual.
5. Botón fijo inferior "Crear y empezar a anotar" (deshabilitado hasta elegir la parte).

**Criterios de aceptación**
- Crear un cliente nuevo toma un solo gesto y no pide más datos.
- Los precios se guardan en centésimas y se muestran con 2 decimales.

---

# FASE 4: Captura de pesos en compra (el corazón del MVP)

**Tareas**
1. Componente `TecladoPesos` reutilizable, con todas las reglas de la Parte 0 (autocompletado, punto automático, auto-agregado, deshacer, vibración, teclado físico, aviso de outlier).
2. Selector de tipo con colores y contador por tipo.
3. Componente `ColumnasPesos` (usa `groupColumns`), con las últimas 2 columnas por tipo y el botón "Ver todas". El último peso agregado se resalta con una animación breve que respete `prefers-reduced-motion`.
4. Barra inferior fija con totales y botón "Terminar compra".
5. Persistir cada peso en Dexie al instante (si la app se cierra, no se pierde nada) y poder retomar el movimiento desde su card.

**Criterios de aceptación**
- Capturar 20 pesos de un tipo requiere 80 toques (4 por peso) con las opciones por defecto, sin tocar "Agregar".
- Con 1500 paquetes en el movimiento, la pantalla sigue fluida (sin renderizar todo).
- Tests de componente para el teclado: `1 2 . 4` + Agregar da `12.40`.

---

# FASE 5: Venta con pesos de compra registrados

**Tareas**
1. Barra de granjas (siempre una seleccionada, con conteo de stock disponible) y selector de tipo con "quedan N" para la granja elegida.
2. Reutilizar `TecladoPesos` en modo "Marcar". Implementar el emparejamiento exacto con FIFO y los 3 mensajes de error de la Parte 0.
3. Lista de disponibles filtrada por prefijo mientras se teclea, agrupada con `×N` para repetidos, virtualizada y limitada a 60 elementos. Tocar un elemento lo marca.
4. Sección "Marcados en esta venta" para desmarcar. Vista previa en columnas de 10 de lo marcado.
5. Barra inferior con paquetes, kg, total en S/ y, si hay costo, la ganancia en vivo. Botón "Confirmar venta".
6. Cancelar movimiento: libera los paquetes `EN_VENTA` a `EN_CAMION`.

**Criterios de aceptación**
- Con dos paquetes de 12.90 en la misma granja, el primero marcado es el de la compra más antigua, y el aviso "Ya van 2…" aparece al marcar el segundo.
- El tercer intento muestra "Ya marcaste los 2 de 12.90 kg…".
- Un paquete no puede quedar asignado a dos movimientos (verificar dentro de una transacción).
- Marcar y desmarcar no genera registros nuevos en `paquetes`.

---

# FASE 6: Venta sin pesos de compra y terminar movimientos

**Tareas**
1. Modo de captura para venta con el check desmarcado: el teclado agrega, y cada peso crea un paquete `VENTA_SIN_COMPRA` ya asignado al movimiento.
2. Terminar movimiento (compra y venta): transacción que cambia `EN_VENTA` a `VENDIDO`, marca el movimiento como `TERMINADO` y encola el sync.
3. Vista de detalle de un movimiento terminado, de solo lectura, con columnas de 10 completas.
4. Marcar en las cards los movimientos sin pesos de compra.

**Criterios de aceptación**
- Un movimiento terminado no se puede editar (solo ver y exportar).
- Terminar una venta de 300 paquetes es atómico: si falla, no queda nada a medias.

---

# FASE 7: Ganancia o pérdida

**Tareas**
1. Integrar las funciones puras de ganancia en inicio, detalle de viaje, cards de venta, barra de captura de venta, formulario (costo de referencia) y cierre de viaje (tabla de resultado por tipo).
2. Colores verde/rojo con signo explícito (+ / −) y % sobre costo. No depender solo del color (accesibilidad).
3. Aviso en el momento si un paquete se marca por debajo de su costo.
4. Nota visible de paquetes excluidos por falta de precio o costo.
5. "En camión, a costo" en inicio y en el cierre.

**Criterios de aceptación**
- Tests de dominio: ganancia con precios faltantes, con venta bajo costo, con remanente, y con paquetes de varios lotes con distinto precio de compra.
- Un viaje con la mitad sin vender no muestra pérdida por lo no vendido.

---

# FASE 8: Exportación a PDF y Excel

**Tareas**
1. Exportar por movimiento y por viaje. Encabezado con fecha, viaje, parte, precios por kg y total a cobrar (en ventas).
2. Mismo diseño de columnas de 10 por tipo con subtotales, usando la salida de `groupColumns`. PDF en A4 listo para imprimir.
3. Excel con un bloque por tipo y **subtotales con fórmulas reales** (`SUM`), para que al editar un peso se recalcule.
4. Todo en el cliente y funcionando sin conexión. Compartir/descargar con la API nativa del móvil cuando exista.

**Criterios de aceptación**
- El PDF y el Excel muestran los mismos totales que la pantalla.
- Un movimiento de 300 paquetes se exporta sin congelar la interfaz.

---

# FASE 9: Sincronización con Supabase

**Tareas**
1. Entregar el SQL de Supabase: tablas espejo en snake_case con `id uuid primary key`, `updated_at`, `deleted_at`, `owner_id uuid default auth.uid()`, índices y **políticas RLS** (cada usuario solo ve y escribe lo suyo).
2. Motor de sincronización: procesar `sync_queue` en lotes de 200, upsert idempotente por `id`, backoff, registro de `ultimo_error` y marcado de `synced_at`. Colapsar operaciones repetidas sobre la misma entidad.
3. Supabase Auth con sesión persistente. Sin sesión válida la app sigue funcionando y la cola crece. Al reautenticar, se vacía.
4. Disparadores: `online`, apertura de la app, botón manual desde el chip. El chip muestra pendientes, "sincronizando…" y error con reintento.
5. `navigator.storage.persist()` al primer uso, aviso de instalación y exportación de respaldo JSON del viaje.

**Criterios de aceptación**
- Reintentar un lote nunca duplica datos.
- Sincronizar 1500 paquetes se completa en lotes sin bloquear la UI.
- Probado: modo avión → crear datos → recuperar conexión → todo llega a Supabase.

---

# FASE 10: Fletes y endurecimiento

**Tareas**
1. Habilitar el tipo FLETE: formulario con cliente (mismo `q-select` con crear al vuelo), líneas por tipo y cantidad, y consulta/búsqueda de fletes por cliente.
2. Pruebas end-to-end (Playwright) del flujo completo: iniciar viaje → compra → venta con y sin pesos → cierre → exportación.
3. Revisión de rendimiento con datos de prueba de 3000 paquetes y 5 movimientos.
4. Manejo de errores y estados vacíos en todas las pantallas; revisar accesibilidad (contraste, tamaño táctil, etiquetas).
5. Documentar en `docs/` el modelo de datos, las reglas de dominio y cómo ejecutar tests.

**Criterios de aceptación**
- El flujo completo pasa en un viewport móvil de 390×844.
- Sin errores en consola; Lighthouse PWA y rendimiento aceptables en móvil.

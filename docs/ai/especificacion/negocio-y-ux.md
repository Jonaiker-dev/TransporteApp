# Negocio, reglas y experiencia de uso

> Especificación objetivo extraída del documento original. No certifica el estado del código ni autoriza su implementación. Consulta [el estado actual](../contexto/estado-actual.md) y [AGENTS.md](../../../AGENTS.md).

## Negocio

Empresa con 1 camión y 1 chofer que cubre la ruta Chincha → Lima. Compra jabas de huevo en granjas (por kg, precio variable por día y por tipo) y las vende en Lima a un precio mayor. Casi nunca hace fletes para terceros, pero debe poder registrarlos. Hoy todo se lleva en cuadernos escritos a mano. El dolor principal es el tiempo perdido anotando pesos. La prioridad absoluta del MVP es **reducir el tiempo de captura de pesos**.

- Tipos de huevo: Rosado (R), Pardo (P), Jumbo (J).
- Un "paquete" es una jaba con huevos. Siempre se vende por kg. Cada paquete trae una etiqueta con su peso (ya tareado). Los pesos siempre se manejan con **2 decimales**.
- Se compran cientos de paquetes por viaje (~1500 por viaje).
- Al vender en Lima se bajan paquetes del apilado del camión según los van teniendo a mano, de una o varias granjas. El vendedor sabe de qué granja es lo que está entregando.
- Muchas veces no se vende todo: lo que sobra se queda en el camión para el siguiente viaje.

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

## Fuera del MVP

Lector de código de barras, voz, OCR de etiquetas, multiusuario, pull/sync bidireccional, pagos y cobranza, panel web de administración, gastos operativos, ganancia neta, estimación de costo para ventas sin compra.

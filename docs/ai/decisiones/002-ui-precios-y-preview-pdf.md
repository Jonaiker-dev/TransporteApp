# ADR-002: UI de captura, precios faltantes y vista previa PDF

Actualización: las reglas de precios descritas aquí fueron reemplazadas por [ADR-006](006-correcciones-y-nombres-descarga.md). El resto se conserva como antecedente.

Estado: aceptada por solicitud explícita del usuario. Sustituye la prohibición absoluta de cambiar precios de movimientos terminados únicamente para la excepción siguiente. No autoriza cambiar pesos, estados ni precios ya asignados.

La referencia visual proporcionada ahora es [demo-pesos.html](../../template/demo-pesos.html). Se utiliza su organización: tipo de huevo dentro del teclado, display visible, verificación del último peso, columnas compactas, granja seleccionada, duplicados agrupados y pie con totales y una acción principal. Se conserva la paleta azul, las tarjetas y las rutas del proyecto. La demo sigue siendo referencia; no se importan sus datos ficticios ni su almacenamiento en memoria.

Los precios presentes, incluido cero, son inmutables. Una compra o venta con precios faltantes permite una sola operación adicional de asignación, incluso si el movimiento y el viaje están cerrados. Esa operación completa todos los tipos que ya tienen paquetes y todavía no tienen precio. Los otros tipos son opcionales. El usuario revisa la confirmación única; después no puede añadir ni cambiar más precios en ese movimiento, aunque queden tipos sin usar. `precios_completados_at` conserva el bloqueo al recargar. La escritura y la cola de respaldo se confirman en la misma transacción, lo que también serializa dos intentos simultáneos. No se reabre el viaje ni se modifica inventario. La ganancia se recalcula con los precios de origen desde los datos locales.

No hace falta cambiar la versión de IndexedDB: la propiedad nueva no es un índice ni cambia la clave. Supabase sí necesita la migración aditiva `202610230002_completar_precios.sql` antes de respaldar movimientos con ese campo.

Un «12.90 ×2» representa dos paquetes existentes de la misma granja y tipo. Cada toque o captura marca exactamente uno, por fecha de compra más antigua y luego orden de captura. No se crean paquetes nuevos. El contador baja de dos a uno y desaparece al marcar el segundo; un tercer intento explica que ya se marcaron ambos. Desmarcar vuelve a poner un paquete disponible. Los últimos marcados se muestran por separado y con acciones distinguibles.

La exportación PDF descarga directamente y deja de invocar el panel nativo de compartir. Se añade «Ver PDF» en movimiento y viaje, con vista dibujada en canvas, navegación por páginas, zoom, descarga y apertura en otra pestaña. La dependencia PDF.js y su worker se cargan al abrir la vista y se incluyen en el precache PWA para funcionar sin red. Se mantiene pdfmake para generar el documento, por lo que la vista previa muestra el PDF real. Un movimiento en curso se identifica como borrador. La vista está encapsulada en `VistaPreviaPdf.vue` para poder retirarla cuando el usuario lo indique.

API de referencia del visor: [ejemplos oficiales de PDF.js](https://mozilla.github.io/pdf.js/examples/). La librería instalada define los parámetros de render y el ciclo de vida del worker usados en el componente.

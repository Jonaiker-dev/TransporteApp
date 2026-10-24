# ADR-007: edición de pesos en la misma celda hasta el cierre del viaje

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada. El usuario aprobó el ajuste con «listo aplica las mejoras» en esta conversación.
- Tarea: sustituir el diálogo con teclado por edición en la celda y permitir corregir movimientos terminados.
- Contexto: ADR-006 limitaba correcciones a movimientos en curso y, en ventas con compra, obligaba a desmarcar. El usuario solicita editar directamente y bloquear al cerrar el viaje.
- Problema: corregir un peso sin abrir otra ventana, preservando la coherencia de paquetes que aparecen tanto en compra como en venta.
- Alternativas: conservar la ventana; duplicar el peso por movimiento; editar el paquete compartido con protección de los viajes vinculados. Se elige la tercera, evitando una segunda representación del peso.
- Decisión: tocar un peso abre un campo en su misma celda con el valor actual, selector de tipo y acciones para guardar o cancelar. No hay diálogo ni teclado propio de edición. Se usa entrada decimal del dispositivo, se admite coma o punto y se valida un peso positivo con hasta dos decimales. No se guarda al perder el foco.
- Movimientos terminados: se permite corregir sus paquetes mientras su viaje y los viajes de todos los movimientos vinculados estén abiertos. La corrección conserva ID, orden de captura y venta, procedencia y estados. No se reabre ni vuelve a terminar ningún movimiento.
- Paquete compartido: el peso y tipo son atributos del paquete. La compra, la venta, el inventario y los cálculos derivados leen la misma entidad y reflejan la corrección. Si la compra o venta pertenece a un viaje cerrado, la UI explica el bloqueo en la fila y el repositorio rechaza la escritura dentro de la transacción, incluso con una pantalla desactualizada.
- Consecuencias y riesgos: se actualizan subtotales, importes y ganancia de todos los movimientos afectados. Los cambios de tipo pueden dejar un tipo sin precio; se mantiene la advertencia existente y la exclusión del cálculo cuando corresponda. Los archivos exportados anteriormente no se reescriben; hay que exportarlos de nuevo para reflejar la corrección.
- Compatibilidad y migración: no hay cambios de esquema, dependencias ni migraciones. La entidad y su cola de respaldo se guardan atómicamente. La UI sigue leyendo exclusivamente datos locales.
- Validación: pruebas de repositorio para movimientos terminados, paquete compartido, rollback, pertenencia y ambos sentidos del vínculo con viajes cerrados; navegador para editar/cancelar/validar en la celda, persistencia, cálculos compartidos y bloqueo; tipos, lint y compilación PWA.
- Reemplaza: las reglas de corrección de pesos de [ADR-006](006-correcciones-y-nombres-descarga.md). Mantiene sus reglas de precios y descargas.

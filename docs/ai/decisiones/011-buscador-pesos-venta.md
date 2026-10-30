# ADR-011: buscador numérico para vender pesos existentes

- Fecha: 26 de octubre de 2026, `America/Lima`.
- Estado: aceptada.
- Tarea: reemplazar la calculadora en ventas con pesos de compra registrados.
- Contexto: `CapturaPage.vue` compartía `TecladoPesos` para capturar pesos nuevos y filtrar paquetes existentes; completar dos decimales también marcaba el peso.
- Problema: la calculadora ocupa espacio y confunde la búsqueda con el registro de una venta.
- Alternativas: conservar el teclado con autoagregado desactivado o usar un buscador con teclado nativo. Se elige un buscador visible con etiqueta, icono y acción de limpiar, siguiendo las recomendaciones de formularios móviles de UI/UX Pro Max de NextLevelBuilder.
- Decisión: en ventas con compra, un campo `Buscar peso (kg)` filtra por prefijo. Solo admite dígitos y un separador decimal con hasta dos decimales; la coma se normaliza a punto. Escribir, pegar o pulsar Enter no marca paquetes. Cada toque en un resultado marca una unidad. Limpiar restaura la lista y el foco del campo. Se conservan granja, tipo, duplicados FIFO, deshacer y selección de paquetes.
- Consecuencias: esta solicitud reemplaza el auto-marcado descrito en la especificación original de venta con compra. Compras y ventas sin pesos previos conservan el teclado de captura. No se ofrecen acciones para crear pesos desde el buscador.
- Compatibilidad y datos: sin cambios de esquema, repositorios o dependencias.
- Validación: búsqueda numérica, coma, texto pegado, Enter sin registro, duplicados, deshacer, limpiar, estado vacío y geometría en 320/340/390 px; regresiones de compras, ventas directas, cancelación y PDF.
- Aprobación: solicitud explícita del usuario en esta conversación.
- Decisión que reemplaza: ninguna; se sustituye el comportamiento de auto-marcado de la especificación original para este flujo.

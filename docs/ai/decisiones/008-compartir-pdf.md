# ADR-008: compartir PDF con nombre elegido

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada por el usuario con «agrega la mejora» tras aprobar el alcance de compartir PDF.
- Tarea: compartir PDF desde móvil, eligiendo primero el nombre del archivo y luego WhatsApp u otra aplicación del teléfono.
- Contexto: ya existen generación local de PDF, nombres editables y un servicio para compartir Excel/JSON. La exportación PDF descarga directamente.
- Problema: ofrecer el archivo PDF al panel nativo de compartir, conservando descargas y sin subir documentos a un servidor.
- Alternativas: enlace de texto a WhatsApp, integración remota de mensajería o Web Share con archivos. Se elige Web Share para entregar el PDF generado localmente al sistema del dispositivo. La aplicación no elige destinatarios ni envía mensajes automáticamente.
- Decisión: añadir `CompartirPdf.vue` en movimiento, viaje y vista previa. Reutiliza el PDF preparado por el visor cuando está disponible; en las otras pantallas lo genera antes de abrir el diálogo del nombre. Al confirmar «Compartir» se crea el `File` con extensión `.pdf` y se llama a `navigator.share`.
- Activación y cancelación: no se genera el PDF después de confirmar el nombre; la llamada a compartir sigue al toque de confirmación. Cancelar el nombre o el panel nativo no descarga ni envía nada.
- Compatibilidad: se comprueban `navigator.share` y `navigator.canShare({ files })`. Si no se puede compartir el archivo, el diálogo explica la limitación y ofrece descargarlo con el nombre elegido para adjuntarlo manualmente. Si la llamada nativa falla, aparece un error con la alternativa de descarga. La exportación PDF existente sigue descargando.
- Consecuencias y riesgos: las aplicaciones del panel dependen del sistema; WhatsApp debe estar instalado y disponible como destino. El soporte depende del navegador y del contexto seguro. La prueba automatizada sustituye la API del sistema: no certifica la entrega real en WhatsApp.
- Compatibilidad de datos: sin dependencias nuevas, cambios de esquema ni operaciones remotas; se conservan todos los cambios locales previos.
- Validación: tipos, lint, compilación PWA, pruebas unitarias y E2E para nombre, archivo PDF real, activación de usuario, tres puntos de acceso, cancelación, fallo y alternativa de descarga. Comprobación real de Android/iOS pendiente de dispositivo físico.
- Referencia técnica: [Navigator.share en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
- Decisiones relacionadas: amplía [ADR-006](006-correcciones-y-nombres-descarga.md) y conserva la descarga directa de [ADR-002](002-ui-precios-y-preview-pdf.md).

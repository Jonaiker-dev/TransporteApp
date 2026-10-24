# ADR-006: correcciones y nombres de descarga

Actualización: las reglas de corrección de pesos se reemplazan por [ADR-007](007-edicion-pesos-en-celda.md). Precios y descargas conservan lo definido aquí.

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada por aprobación explícita del plan en esta conversación.
- Tarea: elegir nombres de documentos, corregir registros específicos y editar precios hasta cerrar el viaje.
- Contexto: `completarPrecios` limitaba la asignación a una vez, incluso en viajes cerrados. La captura solo ofrecía deshacer y desmarcar los últimos registros visibles; las exportaciones usaban nombres automáticos.
- Problema: corregir errores antiguos sin deshacer entradas posteriores y ajustar precios antes del cierre.
- Alternativas: eliminar y volver a capturar todos los pesos posteriores, o editar únicamente el paquete seleccionado. Se elige la segunda para conservar identidad, procedencia y orden.
- Decisión: permitir corregir peso y tipo de paquetes de compras y ventas sin compra mientras el movimiento esté en curso y el viaje abierto. En ventas con compra, desmarcar el paquete seleccionado y elegir el correcto del inventario; no modificar su peso de origen. Las columnas completas permiten acceder a registros anteriores.
- Precios: permitir asignaciones repetidas en compras y ventas, incluso terminadas, únicamente si el viaje propietario está abierto. El repositorio verifica el estado dentro de la transacción. Reabrir un viaje mediante el flujo existente vuelve a permitir editar sus precios. Los precios de tipos usados deben estar completos al guardar; cero sigue siendo válido.
- Descargas: solicitar un nombre editable en PDF, Excel y JSON, incluidas vista previa y exportaciones del viaje. Conservar la extensión, limpiar caracteres inválidos y permitir cancelar. Excel y JSON conservan el mecanismo de compartir cuando el dispositivo lo admite.
- Consecuencias: corregir precios actualiza los cálculos locales derivados, sin cambiar estados de paquetes ni reabrir movimientos. Los cambios y la cola de respaldo se escriben atómicamente.
- Compatibilidad: se conserva `precios_completados_at` como fecha de la última edición; deja de actuar como bloqueo. No se cambia el esquema Dexie ni se requieren migraciones nuevas. No se modifica ningún servicio remoto.
- Validación prevista: Vitest para integridad, rollback y bloqueo por cierre; Playwright para edición de registros antiguos, persistencia y nombres de descarga; TypeScript, ESLint, formato y compilación PWA.
- Decisión que reemplaza: sustituye únicamente las reglas de precios de [ADR-002](002-ui-precios-y-preview-pdf.md); mantiene el resto de esa decisión.

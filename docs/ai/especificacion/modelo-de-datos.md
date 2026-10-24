# Modelo de datos objetivo

> Especificación objetivo extraída del documento original. No certifica el estado del código ni autoriza su implementación. Consulta [el estado actual](../contexto/estado-actual.md) y [AGENTS.md](../../../AGENTS.md).

## Modelo de datos (Dexie)

- `viajes`: id, fecha_inicio, fecha_fin|null, estado (`ABIERTO`|`CERRADO`), nota.
- `partes` (clientes, granjas, dueños de flete): id, nombre, nombre_norm (minúsculas sin tildes, para buscar), roles[] (`CLIENTE`|`GRANJA`|`FLETE`). Se crean "al vuelo" solo con el nombre.
- `movimientos`: id, viaje_id, tipo (`COMPRA`|`VENTA`|`FLETE`), fecha, parte_id, precios {R,P,J} en centésimas de sol por kg (opcionales), tiene_pesos_compra (bool, solo VENTA), estado (`EN_CURSO`|`TERMINADO`).
- Extensión autorizada: `precios_completados_at` (fecha opcional) bloquea una segunda asignación de precios faltantes. Ver [ADR-002](../decisiones/002-ui-precios-y-preview-pdf.md).
- `paquetes` (un registro por jaba): id, tipo, peso_c, granja_id|null, compra_mov_id|null, venta_mov_id|null, estado (`EN_CAMION`|`EN_VENTA`|`VENDIDO`), origen (`COMPRA`|`VENTA_SIN_COMPRA`), orden_captura (secuencia entera, define el orden de las columnas).
- `flete_lineas`: id, movimiento_id, tipo, cantidad.
- `sync_queue`: seq autoincremental, tabla, entidad_id, operacion, intentos, ultimo_error.
- Índices clave de `paquetes`: `[estado+tipo+granja_id]`, `compra_mov_id`, `venta_mov_id`.
- El inventario pertenece al **camión**, no al viaje: un paquete `EN_CAMION` de un viaje anterior sigue disponible en el siguiente.

## Decisiones pendientes de adaptación

Los metadatos comunes, UUID y transacciones se describen en [arquitectura](arquitectura.md). La cola tiene campos técnicos propios; precisar su contrato, la asignación de orden_captura y la transición desde los IDs y la outbox existentes antes de implementar una migración. La copia del modelo no crea tablas ni modifica datos.

# ADR-005: Historial y búsqueda unificada de movimientos

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada.
- Tarea relacionada: abrir movimientos desde sus tarjetas y consultar el historial completo.
- Contexto: `ViajePage.vue` consulta un viaje; `useTransporte` ya comparte una fotografía local de todos los viajes. `partes` reúne clientes, granjas y dueños de flete.
- Problema: el icono era el único acceso al detalle y faltaba una consulta transversal al historial.
- Alternativas: búsquedas independientes por rol o una consulta común con vistas de historial y búsqueda.
- Decisión: `/movimientos` y `/movimientos/buscar` comparten componente y composable. Se reutilizan los índices y el adaptador de movimientos; la UI consume la fotografía local existente. El buscador único normaliza nombres y contempla ventas con paquetes de la granja encontrada. Los filtros opcionales son fecha, tipo y estado; los roles no separan la búsqueda.
- Navegación: toda la tarjeta abre el detalle por clic o teclado. Los parámetros de búsqueda y el límite visible viven en la URL; el detalle admite retorno únicamente a las dos rutas de movimientos.
- Diseño: se conservan AppCard, AppButton, AppButtonRow y los tokens actuales. Se aplicó la skill local `ui-ux-pro-max`; `nextlevelbuilder` no estaba disponible y el usuario aprobó esta alternativa.
- Ampliación solicitada: el buscador usa QSelect con entrada libre y hasta 20 sugerencias del catálogo local compartido, ordenadas y sin nombres normalizados duplicados. No separa clientes y granjas ni crea registros al buscar. La selección completa el nombre y mantiene el filtro en la URL.
- Consecuencias y riesgos: se muestran inicialmente 40 resultados, ampliables de 40 en 40. La proyección usa toda la fotografía local; esta paginación limita nodos renderizados, no lecturas de Dexie ni memoria del historial. Los registros históricos sin paquetes individuales solo pueden relacionarse por su parte directa.
- Compatibilidad: sin cambios de esquema, migraciones, nuevas dependencias ni lecturas de Supabase. Se conservan los totales históricos y los datos locales.
- Validación prevista: pruebas de filtros entre viajes y roles, proyección de totales, navegación por tarjeta y teclado, retorno, recarga, funcionamiento offline y tamaños móviles en claro/oscuro.
- Aprobación: el usuario respondió «si apruebo» al plan presentado en esta conversación.
- Decisión que reemplaza: ninguna.

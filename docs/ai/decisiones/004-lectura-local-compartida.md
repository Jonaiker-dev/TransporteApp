# ADR-004: lectura local compartida y creación sin recargas del historial

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada.
- Tarea: resolver la demora al crear compras, ventas y fletes y la aparición temporal
  de listas vacías.
- Contexto: cada consumidor de `useTransporte` abría un `liveQuery(snapshot)` propio.
  `useViaje` añadía recargas completas al observar cambios y antes de navegar.
  El adaptador de creación leía otra vez toda la base y la página de viaje recargaba
  lista y resumen con varias consultas asíncronas independientes.
- Evidencia: con 12 viajes, 600 movimientos y 30 000 paquetes sintéticos, la creación
  tardó entre 7533 y 8031 ms y ejecutó entre 114 y 130 llamadas IndexedDB `getAll`.
- Alternativas: reducir solo las recargas de los formularios o compartir también la
  lectura local y derivar lista y resumen de una misma instantánea.
- Decisión: compartir una suscripción con recuento de consumidores y liberarla al
  desmontarse el último; reutilizar sus datos al navegar. Después de confirmar una
  escritura, esperar su publicación en esa misma lectura antes de abrir la pantalla,
  sin iniciar otra consulta. Proyectar lista y resumen de forma síncrona con índices
  en memoria por movimiento y parte, calculando la ganancia una vez por movimiento.
- Motivo: eliminar las lecturas repetidas y las respuestas asíncronas que podían
  sustituir una lista reciente por otra anterior. La espera de publicación evita
  mostrar un movimiento recién guardado como inexistente.
- Consecuencias: el estado reactivo se comparte durante la vida de la PWA; en el
  último desmontaje se libera y reinicia. Las pruebas que escriben mediante IndexedDB
  nativo deben reabrir la app, pues esas escrituras eluden las notificaciones Dexie.
- Compatibilidad: misma base `transporteapp`, sin nuevas tablas, versiones de esquema
  o dependencias. Escritura y cola conservan su transacción. No se espera a Supabase.
- Validación: pruebas de suscripción, ciclo de vida y errores; integración de creación
  y proyección; captura, exportaciones y modo offline; comparación reproducible con
  `node tests/bench-movimientos.mjs` después de `npm run build:pwa`.
- Aprobación: solicitud expresa de investigar y solucionar la lentitud. No autoriza
  despliegue, commit, push ni migraciones remotas.

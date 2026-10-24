# ADR-001: Adaptar la aplicación conservando UI y datos locales

- Fecha: 23 de octubre de 2026, America/Lima.
- Estado: aceptada dentro de la autorización de implementación del usuario.
- Alcance: las diez fases de `docs/ai`, conservando UI y enfoque móvil. Sin commits ni despliegues.

La aplicación ya tenía Quasar, PWA, login local, formularios y una base Dexie versión 4. Los viajes y pesos individuales todavía no existían; había indicadores y pantallas de demostración. Se conservan el layout, tarjetas, paleta, rutas de compra/venta, formularios y navegación inferior. La captura completa las pantallas de detalle que eran placeholders.

Se mantiene una única IndexedDB, `transporteapp`. Las versiones 5, 6 y 7 archivan la tabla numérica de movimientos, la retiran y crean su reemplazo con UUID, dentro de la transacción de actualización de IndexedDB. El archivo y los clientes antiguos permanecen conservados. Los totales históricos se muestran explícitamente como agregados; no se inventan jabas, stock ni costos. El viaje importado queda cerrado. Una prueba abre una base versión 4 y verifica la migración real con fake-indexeddb.

El esquema está en `src/db/database.ts`; `src/lib/offline-database.ts` reexporta la misma instancia para compatibilidad. Las API existentes de viajes adaptan contratos de pantalla hacia los repositorios nuevos. La UI observa Dexie mediante el composable; Supabase se utiliza exclusivamente para Auth y push, nunca para cargar datos de negocio.

Los pesos y precios nuevos se almacenan como enteros. Los precios vacíos se omiten; un precio cero explícito es un precio conocido. La ganancia redondea el importe en céntimos por paquete. Los paquetes sin costo o precio no se incluyen en la ganancia y se cuentan en una nota. El importe total vendido sí incluye ventas sin costo conocido si tienen precio de venta.

Una compra en curso persiste sus pesos inmediatamente. Para evitar cambios de costo/stock durante una venta, solo pueden marcarse paquetes de compras terminadas. El inventario físico incluye paquetes reservados hasta confirmar su venta. El orden de compra se conserva en `orden_captura`; el marcado registra `orden_venta` para mostrar y exportar la venta en su propio orden, sin alterar FIFO de origen.

Las exportaciones comparten `groupColumns`, generan PDF A4 y Excel con fórmulas y ejecutan la generación en Web Worker. El service worker precachea también el worker, fuentes, módulos y fotografías, para exportar sin red. Compartir usa la API nativa cuando existe y descarga como alternativa.

La actualización reactiva de indicadores no comparte el estado de envío del formulario, para evitar desactivar su botón durante un toque al crear una parte. Al abrir offline se conserva el worker instalado y se aplaza su registro de actualización hasta reconectar. La carga del SDK de respaldo también es diferida para no formar parte del arranque necesario para trabajar localmente.

Se reemplazó el login de demostración por Supabase Auth en la misma UI. Se puede continuar trabajando sin iniciar sesión; no se generan cuentas ni contraseñas de prueba. La vinculación local al primer propietario de respaldo impide enviar accidentalmente datos a otra cuenta. No hay pull ni cambio de propietario automático. Los registros antiguos de usuarios no se exportan ni se utilizan como autenticación remota.

Dependencias incorporadas por requisitos: Supabase JS, pdfmake 0.2 y ExcelJS; Vitest, fake-indexeddb, Vue Test Utils y jsdom para pruebas; Playwright para flujos móviles; Lighthouse para auditoría. Las declaraciones de pdfmake se fijan a su rama 0.2. Se corrigió `lint:check` para comprobar formato sin reescribir archivos.

La validación real contra Supabase requiere URL, clave pública, un usuario y aplicar el SQL en el proyecto de destino. Esta sesión no configura un servicio remoto ni declara validada su RLS solo por entregar SQL.

# Revisión: preparación PWA para Netlify

- Tarea: preparar la publicación solicitada, sin desplegar.
- Cambios y motivo: `netlify.toml` define Node 24, instalación de las dependencias PWA
  existentes y build de `dist/pwa`. `public/_headers` permite revalidar HTML, worker y
  manifiesto tanto en builds desde Git como en subidas manuales.
- Archivos: los anteriores, `docs/publicar-netlify.md`, ADR-003 y enlaces en los
  índices de decisiones y validación. Esta revisión registra la evidencia.
- Cambios locales previos: preservados; no se reorganizó la aplicación ni se cambió
  el esquema de Dexie. No se añadieron dependencias ni se ejecutaron migraciones.

| Comprobación  | Procedimiento ejecutado                                                           | Resultado                                                                                      |
| ------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Compilación   | `npm run build:pwa`                                                               | Correcta; salida en `dist/pwa`                                                                 |
| Navegador     | `npm run test:e2e -- tests/e2e/flujo.spec.ts`                                     | Caso de flujo móvil offline aprobado: compra, ventas, flete, exportaciones y remanente         |
| Artefactos    | Inspección con Node de manifiesto, iconos, HTML y worker                          | Correctos; precaché incluye los workers de PDF y exportación; sin marcador Workbox pendiente   |
| Configuración | Comparación de cabeceras y comprobación de valores públicos en JS sin imprimirlos | Cabeceras copiadas y configuración pública de Supabase incorporada                             |
| Paquete       | `Compress-Archive` e inspección con `ZipFile`                                     | ZIP de 90 archivos; HTML en raíz, manifiesto, worker y cabeceras; sin `.env` ni `node_modules` |
| Formato       | Prettier sobre los documentos modificados                                         | Correcto                                                                                       |

| Criterio de aceptación                   | Estado              | Evidencia                                                              |
| ---------------------------------------- | ------------------- | ---------------------------------------------------------------------- |
| Carpeta lista para subida manual         | Cumplido            | `dist/pwa`, también empaquetada en `dist/transporteapp-netlify.zip`    |
| Configuración para build desde Git       | Cumplido localmente | `netlify.toml` y guía de variables de build                            |
| Uso sin conexión en navegador            | Cumplido localmente | Prueba Playwright existente con contexto aislado                       |
| Hosting HTTPS e instalación en teléfonos | Pendiente           | Requiere subir la carpeta y probar la URL definitiva en Android/iPhone |
| Respaldo real desde el dominio publicado | Pendiente           | Requiere publicación, sesión y comprobación de filas remotas           |

- Limitaciones: los datos locales están ligados al origen. La URL Netlify tendrá su
  propia IndexedDB y el respaldo push no restaura automáticamente los datos previos.
  Playwright mostró el caso como aprobado (`ok 1`, 18,1 s), pero el proceso no
  finalizó durante el cierre posterior. No se afirma una salida limpia de toda la
  ejecución. La compilación PWA sí terminó con código 0.
- Decisión: [ADR-003](decisiones/003-publicacion-pwa-netlify.md).
- Siguiente paso: el usuario sube `dist/pwa` a Netlify o conecta el repositorio con
  las variables públicas, configura Site URL en Supabase y prueba instalación/respaldo.
  No se realizó despliegue, commit ni push.

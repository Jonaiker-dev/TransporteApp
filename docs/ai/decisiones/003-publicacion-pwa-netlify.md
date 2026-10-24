# ADR-003: Publicación PWA en Netlify

- Fecha: 24 de octubre de 2026, America/Lima.
- Estado: aceptada.
- Tarea relacionada: preparar la publicación PWA en Netlify.
- Contexto: existen `build:pwa`, manifiesto, iconos y un service worker con precaché.
  El router usa hash y Supabase recibe la configuración durante el build.
- Problema: reproducir la compilación remota y permitir la subida manual.
- Alternativas consideradas: compilar desde Git o subir el resultado local.
- Decisión: soportar ambas con `netlify.toml`, Node 24, publicación de `dist/pwa` y
  cabeceras en `public/_headers`. Instalar las dependencias existentes de `src-pwa`
  antes del build remoto. Mantener rutas hash sin una redirección global a HTML.
- Consecuencias: las variables públicas deben existir al compilar y sus cambios
  requieren recompilar. Las cabeceras acompañan también a las subidas manuales.
- Compatibilidad: se conserva Dexie y su esquema. Cada dominio tiene sus datos
  locales; Supabase no descarga automáticamente datos en un origen nuevo.
- Validación prevista: compilación PWA, inspección de manifiesto y precaché,
  prueba de flujo offline existente y comprobación del paquete de subida.
- Aprobación: solicitud de preparar el proyecto como PWA para Netlify. No incluye
  ejecutar un despliegue, commit, push ni migraciones remotas.

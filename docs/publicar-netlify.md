# Publicar TransporteApp como PWA en Netlify

La aplicación se compila con `npm run build:pwa` y se publica desde `dist/pwa`.
Esa carpeta contiene HTML, recursos, iconos, manifiesto y service worker.
El proyecto conserva las rutas con `/#/`.

## Opción 1: subir la carpeta compilada

1. Usar el `.env` local configurado con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
2. Ejecutar `npm run build:pwa` después de cada cambio que se quiera publicar.
3. En la publicación manual de Netlify, arrastrar la carpeta `dist/pwa`.
   También se puede descomprimir `dist/transporteapp-netlify.zip` y subir su contenido
   como carpeta, con `index.html` en la raíz.
4. Abrir la URL HTTPS asignada por Netlify y conservarla para futuras versiones.

La publicación manual no compila el código. Las variables de Supabase ya están
incorporadas al JavaScript generado; cambiarlas en el panel de Netlify no modifica
una carpeta compilada localmente. Hay que recompilar y subir la nueva versión.
No subir la raíz del repositorio, `.env` ni `node_modules`.

## Opción 2: compilar desde un repositorio Git

Conectar el repositorio a Netlify y usar su raíz como directorio base.
`netlify.toml` configura Node 24, el comando de compilación y la carpeta de publicación.
El comando instala también las dependencias PWA ya declaradas en `src-pwa/package.json`,
incluidas las herramientas de compilación.

Configurar en Netlify estas variables para el proceso de build antes de publicar:

| Variable            | Valor                                         |
| ------------------- | --------------------------------------------- |
| `SUPABASE_URL`      | URL del proyecto de Supabase                  |
| `SUPABASE_ANON_KEY` | Clave pública publishable o anon del proyecto |

Usar esos nombres exactos; no requieren el prefijo `VITE_`. No usar `service_role`
ni claves secretas. No es necesario subir `.env`. Los valores públicos son visibles
en el navegador; los datos se protegen con las políticas RLS y la sesión del usuario.

El repositorio debe incluir `src-pwa/package.json`, `src-pwa/package-lock.json`,
`package-lock.json`, `netlify.toml`, `public/_headers` y los archivos de la aplicación.
No se ha hecho commit ni push durante la preparación local.

## Ajustar Supabase al dominio publicado

En Supabase, abrir Authentication → URL Configuration y establecer **Site URL**
con la URL HTTPS definitiva de Netlify. Si se utiliza un destino de redirección
personalizado para correos de autenticación, incluirlo también en **Redirect URLs**.
Confirmar que un correo de registro nuevo enlaza al dominio publicado.
Las tablas se preparan una sola vez; publicar una nueva versión no requiere repetir
las migraciones SQL.

## Instalar y verificar

1. Abrir la URL publicada con conexión y esperar a que se descarguen los recursos.
2. En Chrome/Edge de Android, usar la opción de instalar o añadir a pantalla de inicio.
   En Safari de iPhone, usar Compartir → Añadir a pantalla de inicio.
3. Abrir la app instalada, crear datos de prueba, activar modo avión y volver a abrirla.
   Comprobar captura y conservación de datos al cerrar y abrir.
4. Reconectar, iniciar sesión y comprobar el respaldo en Supabase con la misma cuenta.
5. En una actualización posterior, cerrar y volver a abrir la app y verificar la versión.

`public/_headers` se copia a la publicación y pide revalidar `index.html`, `sw.js`
y `manifest.json`, para que la caché HTTP no oculte las nuevas versiones.
El funcionamiento sin conexión depende del service worker y su precaché.

Los datos locales de `localhost` no aparecen automáticamente en el dominio Netlify:
IndexedDB pertenece a cada origen. Exportar los datos necesarios antes de cambiar de
dominio. El respaldo actual a Supabase es de envío; no restaura automáticamente el
inventario en el dominio nuevo. Mantener una URL estable evita separar los datos
locales entre distintos dominios.

## Referencias

- [Compilación PWA de Quasar](https://quasar.dev/quasar-cli-vite/developing-pwa/build-commands/).
- [Configuración de Netlify](https://docs.netlify.com/build/configure-builds/file-based-configuration/).
- [Cabeceras de Netlify](https://docs.netlify.com/manage/routing/headers/).
- [URL de producción en Supabase Auth](https://supabase.com/docs/guides/auth/redirect-urls).

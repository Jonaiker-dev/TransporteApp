# Revisión: icono de instalación de Transporte KSM

- Tarea: generar e integrar un icono relacionado con el transporte y la venta de huevos.
- Cambios: camión con tres huevos, fondo azul del sistema de diseño y formas legibles
  a tamaño pequeño. Iconos PNG nuevos para Android, iPhone y pestañas del navegador.
- Archivos: original en `docs/assets/icono-ksm-original.png`, derivados
  `public/icons/ksm-*.png`, `src-pwa/manifest.json`, `index.html`, `quasar.config.ts`
  y `scripts/generate-app-icons.ps1`.
- Cambios previos: conservados; los iconos anteriores permanecen disponibles, pero
  el manifiesto y HTML ahora seleccionan los nuevos.
- Herramienta: `imagegen` integrada, sin CLI ni claves API adicionales.

## Decisión

- Estado: aceptada dentro de la solicitud de crear el icono de instalación.
- Contexto: Quasar agregaba por defecto referencias a iconos Apple anteriores.
- Alternativas: sobrescribir las imágenes existentes o crear recursos con otro nombre.
- Decisión: guardar los nuevos recursos con el prefijo `ksm-` y personalizar la
  inyección de metadatos PWA para conservar una única referencia Apple nueva.
- Consecuencias: el icono tiene fondo opaco y margen para el recorte del sistema.
  Se retira del manifiesto la variante monocroma anterior para evitar mostrar el
  símbolo antiguo. La versión maskable conserva el fondo completo.
- Datos: sin cambios en Dexie, Supabase ni el identificador de la PWA.
- Regeneración de tamaños: en Windows, ejecutar `./scripts/generate-app-icons.ps1`.
  El script usa System.Drawing y no instala dependencias.

## Prompt final

```text
Use case: logo-brand. Create one finished square mobile PWA launcher icon for Transporte KSM, a Peruvian business transporting and selling eggs by truck from Chincha to Lima. Flat, clean, bold, extremely readable at 48 pixels. Full bleed opaque solid deep blue background #124D94, no outer rounded-square border (OS applies its own mask). Center a compact friendly side-view delivery truck silhouette in warm ivory white, two simple dark wheels, carrying three clearly recognizable large egg shapes in an open shallow cargo tray; egg colors ivory and muted warm tan. Harmonious geometric proportions, sophisticated minimal app mark, strong contrast, no outlines thinner than 12px at 1024px. Keep every part of the truck and eggs inside the central circle of radius 38% of image width for Android mask safety; visually balanced generous solid blue surrounding space. No text, no letters, no numbers, no gradients, no shadows, no gloss, no photograph, no 3D, no mockup, no badges, no watermark. A single icon filling a 1024x1024 square canvas.
```

## Validación

| Comprobación                         | Resultado                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Generación de tamaños con PowerShell | Ejecutada: 16, 32, 128, 180, 192, 256, 384 y 512 px, más maskable de 512 px                                             |
| Inspección visual                    | Original e icono de 192 px revisados                                                                                    |
| Compilación PWA                      | `npm run build:pwa` terminó correctamente con código 0                                                                  |
| Referencias y tamaños                | Node verificó dimensiones PNG, referencias nuevas en manifiesto, una única referencia Apple, color y precaché de iconos |
| Formato                              | Prettier y `git diff --check` correctos                                                                                 |
| Paquete Netlify                      | Regenerado `dist/transporteapp-netlify.zip` con los nuevos iconos                                                       |
| Instalación en Android/iPhone        | Pendiente de publicar y probar en teléfonos                                                                             |

- Siguiente paso: subir la nueva carpeta `dist/pwa` o su ZIP actualizado a Netlify.
  Si un teléfono conserva el icono anterior, comprobar una instalación nueva desde
  la URL publicada. Exportar los datos antes de borrar almacenamiento del sitio.
- No se ejecuta despliegue, commit ni push.

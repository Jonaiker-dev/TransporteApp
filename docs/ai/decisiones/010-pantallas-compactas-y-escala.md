# ADR-010: pantallas compactas, texto y escala táctil

- Fecha: 26 de octubre de 2026, `America/Lima`.
- Estado: aceptada.
- Tarea: adaptar la UI a 320–340 px, controlar el zoom y revisar fuentes ampliadas.
- Contexto: el diseño original partía de 360 px. La medición en Edge mostró que la navegación inferior pasaba de 64 a 256 px al apilar botones a 340 px. Las barras de acciones reservaban solo 64 px.
- Problema: navegación que ocupa la pantalla, precios demasiado estrechos y contenido ampliado que no cabe en filas rígidas.
- Alternativas: imponer un ancho mínimo, ocultar el desbordamiento o reorganizar los controles. Se elige reorganizarlos para conservar el contenido y los objetivos táctiles.
- Decisión:
  - La navegación conserva una fila, con separación y relleno compactos; las demás acciones mantienen su adaptación por contenido.
  - Las cabeceras permiten saltos de línea. Los precios usan una cuadrícula adaptable con ancho mínimo expresado en `rem` y limitado por su contenedor.
  - `text-size-adjust: 100%` evita la inflación automática del texto. No se fija un tamaño raíz ni se intenta anular la configuración de accesibilidad del sistema.
  - El viewport solicita escala 1 y desactiva la ampliación del usuario; `touch-action: pan-x pan-y` conserva el desplazamiento vertical y horizontal y excluye el gesto de pinza.
  - Los campos de autenticación mantienen al menos 16 px. El teclado crece si su texto necesita más altura y el desplazamiento reserva espacio para las barras fijas.
- Consecuencias: el zoom queda limitado en los navegadores que respetan estas indicaciones; se reduce la posibilidad de ampliar manualmente el contenido. Safari y las preferencias de accesibilidad pueden prevalecer. No se interceptan los atajos del navegador ni se promete bloquear su menú de zoom.
- Compatibilidad de datos: sin cambios en Dexie, Supabase ni dependencias.
- Validación: compilación PWA, tipos, lint, pruebas unitarias y navegador en 320/340/390 px; prueba de esfuerzo con raíz de 24 px y ampliación del texto directo al 130%, sin acumulación entre rutas. No equivale a probar las preferencias de fuentes en Android/iOS físicos.
- Aprobación: solicitud explícita de implementar, hacer commit y push en esta conversación.
- Fuentes: [viewport](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport), [ajuste automático de texto](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-size-adjust), [gestos táctiles](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) y [límites de escala en Safari](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/).
- Decisión que reemplaza: ninguna.

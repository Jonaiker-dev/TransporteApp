import { crearExcel, crearPDF } from './formatos';
import type { SeccionExportacion } from './exportaciones';
self.onmessage = (
  event: MessageEvent<{ secciones: SeccionExportacion[]; formato: 'pdf' | 'xlsx' }>,
) => {
  void (async () => {
    try {
      const blob =
        event.data.formato === 'pdf'
          ? await crearPDF(event.data.secciones)
          : await crearExcel(event.data.secciones);
      self.postMessage({ blob });
    } catch {
      self.postMessage({
        error: 'No se pudo generar el archivo. Revisa los datos y vuelve a intentar.',
      });
    }
  })();
};

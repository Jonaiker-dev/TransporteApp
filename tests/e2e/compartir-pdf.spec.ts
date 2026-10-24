import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

declare global {
  interface Window {
    ksmPdfShares: { nombre: string; tipo: string; firma: string; activacion: boolean }[];
    ksmPdfShareError: string | null;
  }
}
async function crearCompra(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await page.getByLabel('Granja', { exact: true }).fill('Granja compartir');
  await page.getByRole('option').filter({ hasText: 'Crear "Granja compartir"' }).click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Granja compartir', exact: true })).toBeVisible();
  for (const key of ['2', '1', '4', '5'])
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
  await expect(page.locator('.capture-footer .movement-date')).toContainText('1 paq.');
}

test('comparte PDF con nombre elegido desde movimiento, vista previa y viaje', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    window.ksmPdfShares = [];
    window.ksmPdfShareError = null;
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const activacion = navigator.userActivation.isActive;
        if (window.ksmPdfShareError)
          throw new DOMException('Compartir cancelado o no permitido', window.ksmPdfShareError);
        const file = data.files![0]!;
        window.ksmPdfShares.push({
          nombre: file.name,
          tipo: file.type,
          firma: new TextDecoder().decode((await file.arrayBuffer()).slice(0, 5)),
          activacion,
        });
      },
    });
  });
  await crearCompra(page);
  let descargas = 0;
  page.on('download', () => descargas++);
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Compartir', exact: true })).toBeDisabled();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Compra WhatsApp.pdf');
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.ksmPdfShares))
    .toEqual([
      { nombre: 'Compra WhatsApp.pdf', tipo: 'application/pdf', firma: '%PDF-', activacion: true },
    ]);

  // Canceling the name must never invoke the native share sheet or download.
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByLabel('Nombre del documento', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.ksmPdfShares.length)).toBe(1);
  await page.evaluate(() => {
    window.ksmPdfShareError = 'AbortError';
  });
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Compartir PDF', exact: true }),
  ).not.toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(() => {
    window.ksmPdfShareError = 'NotAllowedError';
  });
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo compartir el PDF');
  expect(descargas).toBe(0);
  await page.evaluate(() => {
    window.ksmPdfShareError = null;
  });
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.ksmPdfShares.length)).toBe(2);
  await expect(page.getByRole('alert')).toHaveCount(0);

  await page.getByRole('button', { name: 'Ver PDF', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Vista previa PDF', exact: true });
  await expect(preview.getByText('Página 1 de 1')).toBeVisible({ timeout: 20000 });
  await preview.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Vista previa');
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.ksmPdfShares.at(-1)?.nombre))
    .toBe('Vista previa.pdf');
  await page.getByRole('button', { name: 'Cerrar vista previa PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Volver al viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Viaje WhatsApp');
  await page.getByRole('button', { name: 'Compartir', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.ksmPdfShares.length)).toBe(4);
  expect(await page.evaluate(() => window.ksmPdfShares.at(-1))).toEqual({
    nombre: 'Viaje WhatsApp.pdf',
    tipo: 'application/pdf',
    firma: '%PDF-',
    activacion: true,
  });
  expect(descargas).toBe(0);
});

test('ofrece descargar con nombre elegido cuando no se admite compartir archivos', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  await crearCompra(page);
  await page.getByRole('button', { name: 'Compartir PDF', exact: true }).click();
  await expect(
    page.getByText('Este navegador no permite compartir este archivo.', { exact: false }),
  ).toBeVisible();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Para WhatsApp');
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe('Para WhatsApp.pdf');
  expect((await readFile((await archivo.path())!)).subarray(0, 5).toString()).toBe('%PDF-');
});

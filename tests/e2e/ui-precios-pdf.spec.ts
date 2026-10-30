import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
declare global {
  interface Window {
    nativeShareCalls: number;
  }
}
async function parte(page: Page, label: string, nombre: string) {
  await page.getByLabel(label, { exact: true }).fill(nombre);
  await page
    .getByRole('option')
    .filter({ hasText: `Crear "${nombre}"` })
    .click();
}
async function peso(page: Page) {
  for (const key of ['1', '2', '9', '0'])
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
}
test('UI móvil, duplicados FIFO, precios editables hasta cierre y PDF visible offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await context.addInitScript(() => {
    window.nativeShareCalls = 0;
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: () => {
        window.nativeShareCalls++;
        return Promise.resolve();
      },
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await parte(page, 'Granja', 'Granja duplicados');
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Granja duplicados' })).toBeVisible();
  const compraURL = page.url();
  // Product requirement: 48px targets and the whole keypad above confirmation.
  for (const width of [360, 390, 420]) {
    for (const dark of [false, true]) {
      await page.setViewportSize({ width, height: width === 360 ? 780 : 844 });
      await page.evaluate((value) => localStorage.setItem('ksm-dark', String(value)), dark);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Granja duplicados' })).toBeVisible();
      const keys = await page.locator('.teclas button').all();
      const bar = await page.locator('.capture-footer').boundingBox();
      for (const key of keys) {
        const box = await key.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(48);
        expect(box!.height).toBeGreaterThanOrEqual(48);
        expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y);
      }
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await page.screenshot({
        path: 'test-results/captura-' + width + '-' + (dark ? 'oscuro' : 'claro') + '.png',
        fullPage: false,
      });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem('ksm-dark', 'false'));
  await page.reload();

  const cero = await page
    .locator('.teclas')
    .getByRole('button', { name: '0', exact: true })
    .boundingBox();
  const footer = await page.locator('.capture-footer').boundingBox();
  expect(cero!.y + cero!.height).toBeLessThanOrEqual(footer!.y);
  await peso(page);
  await expect(page.locator('.movement-date')).toContainText('1 paq.');
  await peso(page);
  await expect(page.locator('.movement-date')).toContainText('2 paq.');
  await expect(page.locator('.q-notification')).toHaveCount(0, { timeout: 10000 });
  await page.screenshot({ path: 'test-results/ui-compra-mobile.png', fullPage: true });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page.goto('/#/viaje/venta');
  await parte(page, 'Vendedor', 'Cliente duplicados');
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Cliente duplicados' })).toBeVisible();
  const ventaURL = page.url();
  await expect(page.locator('.teclas')).toHaveCount(0);
  const buscarPeso = page.getByLabel('Buscar peso (kg)', { exact: true });
  const marcar = await buscarPeso.boundingBox();
  const ventaFooter = await page.locator('.capture-footer').boundingBox();
  expect(marcar!.y + marcar!.height).toBeLessThanOrEqual(ventaFooter!.y);
  const repetido = page.getByRole('button', {
    name: 'Marcar 12.90 kg, 2 disponibles',
    exact: true,
  });
  await expect(repetido).toContainText('×2');
  await repetido.click();
  await expect(
    page.getByRole('button', { name: 'Marcar 12.90 kg, 1 disponibles', exact: true }),
  ).toBeVisible();
  await buscarPeso.fill('12.90');
  await expect(page.locator('.movement-date')).toContainText('1 paq.');
  await page.getByRole('button', { name: 'Marcar 12.90 kg, 1 disponibles', exact: true }).click();
  await expect(page.locator('.search-feedback')).toContainText('Ya van 2 de 12.90 kg');
  await expect(page.locator('.movement-date')).toContainText('2 paq.');
  await expect(page.getByRole('button', { name: /^Marcar .* kg,/ })).toHaveCount(0);
  await expect(page.locator('.movement-date')).toContainText('2 paq.');
  await page
    .locator('.marked-weights')
    .getByRole('button', { name: 'Desmarcar 12.90 kg, Rosado, registro 2', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Marcar 12.90 kg, 1 disponibles', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Marcar 12.90 kg, 1 disponibles', exact: true }).click();
  await expect(page.locator('.movement-date')).toContainText('2 paq.');
  await expect(page.locator('.q-notification')).toHaveCount(0, { timeout: 10000 });
  await page.screenshot({ path: 'test-results/ui-venta-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.evaluate(() => localStorage.setItem('ksm-dark', 'true'));
  await page.reload();
  await expect(page.locator('body')).toHaveClass(/body--dark/);
  await expect(page.locator('.weight-search-field')).toHaveCSS(
    'background-color',
    'rgb(41, 53, 72)',
  );
  await expect(page.getByLabel('Buscar peso (kg)', { exact: true })).toHaveCSS(
    'color',
    'rgb(249, 250, 251)',
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  const marcarCompacto = await page.getByLabel('Buscar peso (kg)', { exact: true }).boundingBox();
  const footerCompacto = await page.locator('.capture-footer').boundingBox();
  expect(marcarCompacto!.y + marcarCompacto!.height).toBeLessThanOrEqual(footerCompacto!.y);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 360);
  await page.screenshot({ path: 'test-results/ui-venta-oscuro-360.png', fullPage: false });
  await page.evaluate(() => localStorage.setItem('ksm-dark', 'false'));
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Editar 12.90 kg, Rosado, registro 1', exact: true })
    .click();
  await page.getByLabel('Peso corregido', { exact: true }).fill('13.90');
  await page.getByRole('button', { name: 'Guardar peso', exact: true }).click();
  await expect(page.locator('.weights-grand-total')).toContainText('26.80');
  await page.goto(compraURL);
  await expect(page.locator('.weights-grand-total')).toContainText('26.80');
  await page
    .getByRole('button', { name: 'Editar 13.90 kg, Rosado, registro 1', exact: true })
    .click();
  await page.getByLabel('Peso corregido', { exact: true }).fill('12.90');
  await page.getByRole('button', { name: 'Guardar peso', exact: true }).click();
  await expect(page.locator('.weights-grand-total')).toContainText('25.80');
  for (const [url, precio] of [
    [compraURL, '5.00'],
    [ventaURL, '6.00'],
  ]) {
    await page.goto(url!);
    await page.getByRole('button', { name: 'Editar precios', exact: true }).click();
    await page.getByLabel('Precio Rosado', { exact: true }).fill(precio!);
    await page.getByRole('button', { name: 'Guardar precios', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload();
    await page.getByRole('button', { name: 'Editar precios', exact: true }).click();
    await page.getByLabel('Precio Rosado', { exact: true }).fill('7.00');
    await page.getByRole('button', { name: 'Guardar precios', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Editar precios', exact: true }).click();
    await page.getByLabel('Precio Rosado', { exact: true }).fill(precio!);
    await page.getByRole('button', { name: 'Guardar precios', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await expect(page.locator('.resultado')).toContainText('+S/ 25.80');
  await page.goto('/#/viaje/cierre');
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  for (const url of [compraURL, ventaURL]) {
    await page.goto(url);
    await expect(page.getByText('Viaje cerrado · precios bloqueados')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar precios', exact: true })).toHaveCount(0);
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Ver PDF', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Vista previa PDF', exact: true });
  await expect(preview).toBeVisible();
  await expect(preview.getByText('Página 1 de 1')).toBeVisible({ timeout: 20000 });
  await expect
    .poll(
      async () =>
        preview.locator('canvas').evaluate((canvas) => {
          if (!(canvas instanceof HTMLCanvasElement)) return 0;
          const ctx = canvas.getContext('2d');
          if (!ctx || !canvas.width) return 0;
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let dark = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i]! < 120 && pixels[i + 3]! > 0) dark++;
          return dark;
        }),
      { timeout: 20000 },
    )
    .toBeGreaterThan(200);
  await page.screenshot({ path: 'test-results/ui-preview-pdf-mobile.png', fullPage: false });
  const anchoInicial = await preview.locator('canvas').evaluate((canvas) => canvas.clientWidth);
  await preview.getByLabel('Zoom del PDF').selectOption('2');
  await expect
    .poll(() => preview.locator('canvas').evaluate((canvas) => canvas.clientWidth))
    .toBeGreaterThan(anchoInicial * 1.9);
  const downloadEvent = page.waitForEvent('download');
  await preview.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Venta revisada');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('Venta revisada.pdf');
  const filePath = await download.path();
  expect((await readFile(filePath!)).subarray(0, 5).toString()).toBe('%PDF-');
  expect(await page.evaluate(() => window.nativeShareCalls)).toBe(0);
  await page.getByRole('button', { name: 'Cerrar vista previa PDF', exact: true }).click();
  await expect(preview).toHaveCount(0);
  const direct = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Venta directa.pdf');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await direct).suggestedFilename()).toMatch(/\.pdf$/);
  expect(await page.evaluate(() => window.nativeShareCalls)).toBe(0);
  expect(errors).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
async function crearParte(page: Page, label: string, nombre: string) {
  await page.getByLabel(label, { exact: true }).fill(nombre);
  await page
    .getByRole('option')
    .filter({ hasText: `Crear "${nombre}"` })
    .click();
}
async function peso(page: Page, value: string) {
  for (const key of value)
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
  await expect(
    page.getByText(`Último: ${value.slice(0, 2)}.${value.slice(2)} kg · Rosado`),
  ).toBeVisible();
}
test('flujo móvil offline: compra, ventas, flete, exportación y remanente', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await expect(page.getByText('Viaje en curso', { exact: true })).toBeVisible();
  await expect(page.getByTestId('continue-trip')).toHaveCSS('background-image', 'none');
  await expect(page.getByTestId('continue-trip')).toHaveCSS('box-shadow', 'none');
  await page.screenshot({ path: 'test-results/inicio-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await crearParte(page, 'Granja', 'Granja Águila');
  await page.locator('.native-price-input').first().fill('5.00');
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Granja Águila' })).toBeVisible();
  await peso(page, '2145');
  await peso(page, '2245');
  await peso(page, '2345');
  await page.screenshot({ path: 'test-results/captura-mobile.png', fullPage: true });
  await page.reload();
  await expect(page.getByText('3 paq. · 67.35 kg', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  const pdfEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  await expect(page.getByLabel('Nombre del documento', { exact: true })).toHaveValue('');
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Compra PDF');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await pdfEvent).suggestedFilename()).toMatch(/\.pdf$/);
  const excelEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Compra revisada');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await excelEvent).suggestedFilename()).toBe('Compra revisada.xlsx');
  await page.getByRole('button', { name: 'Volver al viaje' }).click();
  await page.goto('/#/viaje/venta');
  await crearParte(page, 'Vendedor', 'Cliente Lima');
  await page.locator('.native-price-input').first().fill('6.00');
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await page.getByLabel('Buscar peso (kg)', { exact: true }).fill('21.45');
  await page.getByRole('button', { name: 'Marcar 21.45 kg, 1 disponibles', exact: true }).click();
  await expect(page.locator('.capture-footer').getByText('Ganancia: +S/ 21.45')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page.goto('/#/viaje/venta');
  await crearParte(page, 'Vendedor', 'Venta directa');
  await page.getByRole('checkbox').uncheck();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await peso(page, '2040');
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page.goto('/#/viaje/flete');
  await crearParte(page, 'Cliente del flete', 'Dueño del flete');
  await page.getByLabel('Rosados', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Registrar flete', exact: true }).click();
  await expect(page.getByText('Dueño del flete', { exact: true })).toBeVisible();
  await page.getByLabel('Buscar por cliente o granja').fill('dueño');
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cierre de viaje' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await expect(page.getByText('kg · 2 paq.', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continuar viaje', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await crearParte(page, 'Granja', 'Granja offline');
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Granja offline' })).toBeVisible();
  await peso(page, '2430');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({ path: 'test-results/offline-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  for (const formato of ['PDF', 'Excel']) {
    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: `Exportar ${formato}`, exact: true }).click();
    await page.getByLabel('Nombre del documento', { exact: true }).fill('Documento offline');
    await page.getByRole('button', { name: 'Descargar', exact: true }).click();
    expect((await descarga).suggestedFilename()).toMatch(formato === 'PDF' ? /\.pdf$/ : /\.xlsx$/);
  }
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Cambiar tema claro u oscuro' }).click();
  await expect(page.locator('body')).toHaveClass(/body--dark/);
  await expect(page.getByTestId('purchase-shortcut')).toHaveCSS(
    'background-color',
    'rgb(31, 41, 55)',
  );
  await page.screenshot({ path: 'test-results/oscuro-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

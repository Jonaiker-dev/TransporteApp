import { expect, test, type Page } from '@playwright/test';

// Deliberately remove the SW safety net: details must already be loaded with the app.
test.use({ serviceWorkers: 'block' });

async function compra(page: Page, nombre: string) {
  await page.goto('/#/viaje/compra');
  await page.getByLabel('Granja', { exact: true }).fill(nombre);
  await page
    .getByRole('option')
    .filter({ hasText: `Crear "${nombre}"` })
    .click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
  for (const key of '2145')
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
}

test('detalle táctil sin recargas: repetir aperturas, volver de pausa y editar sin red', async ({
  page,
  context,
}) => {
  const errores: string[] = [];
  page.on('pageerror', (err) => errores.push(err.message));
  await context.addInitScript(() => {
    sessionStorage.setItem(
      'mobile-cargas',
      String(Number(sessionStorage.getItem('mobile-cargas') ?? '0') + 1),
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await compra(page, 'Granja móvil A');
  await compra(page, 'Granja móvil B');
  await page.getByRole('button', { name: 'Volver al viaje', exact: true }).click();
  await expect(page.locator('.movimiento-card')).toHaveCount(2);
  await page.goto('/#/movimientos');
  await expect(page.locator('.movimiento-card')).toHaveCount(2);
  const cargas = await page.evaluate(() => sessionStorage.getItem('mobile-cargas'));
  await context.setOffline(true);
  const cdp = await context.newCDPSession(page);
  for (const width of [360, 390, 420]) {
    await page.setViewportSize({ width, height: 844 });
    for (const nombre of ['Granja móvil A', 'Granja móvil B']) {
      await page.getByRole('link', { name: `Abrir compra de ${nombre}`, exact: true }).tap();
      await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
      await page
        .getByRole('button', { name: 'Editar 21.45 kg, Rosado, registro 1', exact: true })
        .tap();
      await page.getByLabel('Peso corregido', { exact: true }).fill('23.45');
      await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
      await cdp.send('Page.setWebLifecycleState', { state: 'active' });
      await page.evaluate(() =>
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
      );
      await expect(page.getByLabel('Peso corregido', { exact: true })).toHaveValue('23.45');
      await page.getByRole('button', { name: 'Cancelar cambio de peso', exact: true }).tap();
      await expect(page.locator('.weights-grand-total')).toContainText('21.45');
      await page.getByRole('button', { name: 'Editar precios', exact: true }).tap();
      await page.getByRole('button', { name: 'Cerrar precios', exact: true }).tap();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await page.getByRole('button', { name: 'Volver a movimientos', exact: true }).tap();
      await expect(page.locator('.movimiento-card')).toHaveCount(2);
    }
  }
  expect(await page.evaluate(() => sessionStorage.getItem('mobile-cargas'))).toBe(cargas);
  expect(errores).toEqual([]);
});

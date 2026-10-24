import { expect, test, type Page } from '@playwright/test';

async function crearCompra(page: Page, nombre: string) {
  await page.goto('/#/viaje/compra');
  await page.getByLabel('Granja', { exact: true }).fill(nombre);
  await page
    .getByRole('option')
    .filter({ hasText: `Crear "${nombre}"` })
    .click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
  for (const tecla of '2145')
    await page.locator('.teclas').getByRole('button', { name: tecla, exact: true }).click();
  await expect(page.locator('.capture-footer')).toContainText('21.45 kg');
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
}

test('historial y búsqueda unificados: cards, todos los viajes, retorno y uso offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await crearCompra(page, 'Granja Águila');
  await page.getByRole('button', { name: 'Volver al viaje' }).click();
  await expect(page.getByRole('button', { name: 'Abrir movimiento' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Abrir compra de Granja Águila' }).click();
  await expect(page.getByRole('heading', { name: 'Detalle de pesos' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al viaje' }).click();
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await crearCompra(page, 'Otra granja');
  await page.goto('/#/viaje/flete');
  await page.getByLabel('Cliente del flete', { exact: true }).fill('Cliente Lima');
  await page.getByRole('option').filter({ hasText: 'Crear "Cliente Lima"' }).click();
  await page.getByLabel('Rosados', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Registrar flete', exact: true }).click();
  await expect(page.locator('.movimiento-card')).toHaveCount(2);
  await page.goto('/#/');
  await page.getByRole('link', { name: 'Movimientos', exact: true }).click();
  await expect(page.locator('.movimiento-card')).toHaveCount(3);
  const buscar = page.getByRole('link', { name: 'Buscar', exact: true });
  await buscar.click();
  await page.getByLabel('Cliente o granja', { exact: true }).fill('CLIENTE');
  await expect(page.getByRole('option', { name: 'Cliente Lima', exact: true })).toBeVisible();
  await page.getByLabel('Cliente o granja', { exact: true }).press('ArrowDown');
  await page.getByLabel('Cliente o granja', { exact: true }).press('Enter');
  await expect(page.getByLabel('Cliente o granja', { exact: true })).toHaveValue('Cliente Lima');
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  await expect(page.locator('.movimiento-card')).toContainText('Cliente Lima');
  await page.getByLabel('Cliente o granja', { exact: true }).fill('AGUILA');
  await expect(page.getByRole('option', { name: 'Granja Águila', exact: true })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Otra granja', exact: true })).toHaveCount(0);
  await page.getByRole('option', { name: 'Granja Águila', exact: true }).click();
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  await expect(page.getByLabel('Cliente o granja', { exact: true })).toHaveValue('Granja Águila');
  const consulta = page.url();
  const card = page.getByRole('link', { name: 'Abrir compra de Granja Águila' });
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Detalle de pesos' })).toBeVisible();
  await page.getByRole('button', { name: 'Volver a movimientos' }).click();
  await expect(page).toHaveURL(consulta);
  await expect(page.getByLabel('Cliente o granja', { exact: true })).toHaveValue('Granja Águila');
  await page.getByLabel('Desde', { exact: true }).fill('2099-01-01');
  await expect(page.getByRole('heading', { name: 'Sin coincidencias' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar búsqueda', exact: true }).first().click();
  await expect(page.locator('.movimiento-card')).toHaveCount(3);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.movimiento-card')).toHaveCount(3);
  await page.getByLabel('Cliente o granja', { exact: true }).fill('aguila');
  await page.getByRole('option', { name: 'Granja Águila', exact: true }).click();
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/movimientos-claro.png', fullPage: true });
  const busquedaUrl = page.url();
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Cambiar tema claro u oscuro' }).click();
  await expect(page.locator('body')).toHaveClass(/body--dark/);
  await page.goto(busquedaUrl);
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/movimientos-oscuro.png', fullPage: true });
  expect(errors).toEqual([]);
});

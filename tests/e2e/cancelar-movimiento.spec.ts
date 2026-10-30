import { expect, test, type Page } from '@playwright/test';

async function crearMovimiento(page: Page, tipo: 'compra' | 'venta', nombre: string) {
  await page.goto(`/#/viaje/${tipo}`);
  await page.getByLabel(tipo === 'compra' ? 'Granja' : 'Vendedor', { exact: true }).fill(nombre);
  await page
    .getByRole('option')
    .filter({ hasText: `Crear "${nombre}"` })
    .click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: nombre, exact: true })).toBeVisible();
}

async function registrarPeso(page: Page) {
  for (const tecla of '2145')
    await page.locator('.teclas').getByRole('button', { name: tecla, exact: true }).click();
  await expect(page.locator('.capture-footer')).toContainText('21.45 kg');
}

test('cancelar movimientos pide confirmación, conserva al desistir y libera el inventario', async ({
  page,
}) => {
  const errores: string[] = [];
  page.on('pageerror', (error) => errores.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await crearMovimiento(page, 'compra', 'Compra por error');
  await registrarPeso(page);
  const capturaUrl = page.url();

  await page.getByRole('button', { name: 'Cancelar movimiento', exact: true }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toContainText('Cancelar movimiento');
  await dialogo.getByRole('button', { name: 'Seguir anotando', exact: true }).click();
  await expect(dialogo).toBeHidden();
  await expect(page).toHaveURL(capturaUrl);
  await expect(page.locator('.capture-footer')).toContainText('21.45 kg');

  await page.getByRole('button', { name: 'Cancelar movimiento', exact: true }).click();
  await dialogo.getByRole('button', { name: 'Sí, cancelar movimiento', exact: true }).click();
  await expect(page).toHaveURL(/#\/viaje\?id=/);
  await expect(page.locator('.movimiento-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.movimiento-card')).toHaveCount(0);

  await crearMovimiento(page, 'compra', 'Granja con stock');
  await registrarPeso(page);
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await crearMovimiento(page, 'venta', 'Venta por error');
  await page.getByRole('button', { name: 'Marcar 21.45 kg, 1 disponibles', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar movimiento', exact: true }).click();
  await dialogo.getByRole('button', { name: 'Sí, cancelar movimiento', exact: true }).click();
  await expect(page).toHaveURL(/#\/viaje\?id=/);
  await expect(page.locator('.movimiento-card')).toHaveCount(1);
  await expect(page.locator('.movimiento-card')).toContainText('Granja con stock');

  await page.reload();
  await crearMovimiento(page, 'venta', 'Venta correcta');
  await page.getByRole('button', { name: 'Marcar 21.45 kg, 1 disponibles', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  expect(errores).toEqual([]);
});

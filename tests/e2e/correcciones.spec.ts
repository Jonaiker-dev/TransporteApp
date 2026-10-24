import { expect, test } from '@playwright/test';

test('corrige un registro antiguo y conserva la corrección al recargar; nombres y cancelación de descarga', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await page.getByLabel('Granja', { exact: true }).fill('Granja prueba');
  await page.getByRole('option').filter({ hasText: 'Crear "Granja prueba"' }).click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await expect(page.getByRole('heading', { name: 'Granja prueba', exact: true })).toBeVisible();
  const compraURL = page.url();
  for (let i = 0; i < 22; i++) {
    for (const key of ['2', '1', '4', '5']) {
      await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
    }
    await expect(page.locator('.capture-footer .movement-date')).toContainText(`${i + 1} paq.`);
  }
  const antiguo = page.getByRole('button', {
    name: 'Editar 21.45 kg, Rosado, registro 1',
    exact: true,
  });
  await expect(antiguo).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver todas', exact: true }).click();
  await antiguo.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Peso corregido', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Guardar peso', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('mayor que cero');
  await page.getByLabel('Peso corregido', { exact: true }).fill('22,50');
  await page.getByLabel('Tipo corregido', { exact: true }).selectOption('P');
  await page.getByRole('button', { name: 'Guardar peso', exact: true }).click();
  await expect(page.getByLabel('Peso corregido', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Editar 22.50 kg, Pardo, registro 1', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.weights-grand-total')).toContainText('472.95');
  await expect(page.locator('.capture-footer .movement-date')).toContainText('22 paq.');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Editar 22.50 kg, Pardo, registro 1', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Editar 22.50 kg, Pardo, registro 1', exact: true })
    .click();
  await page.getByLabel('Peso corregido', { exact: true }).fill('24.00');
  await page.getByRole('button', { name: 'Cancelar cambio de peso', exact: true }).click();
  await expect(page.locator('.weights-grand-total')).toContainText('472.95');
  await page
    .getByRole('button', { name: 'Editar 22.50 kg, Pardo, registro 1', exact: true })
    .click();
  await page.getByLabel('Peso corregido', { exact: true }).fill('23.50');
  await page.screenshot({ path: 'test-results/edicion-en-celda.png', fullPage: true });
  await page.getByRole('button', { name: 'Guardar peso', exact: true }).click();
  await expect(page.locator('.weights-grand-total')).toContainText('473.95');
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Descargar', exact: true })).toBeDisabled();
  let descargas = 0;
  page.on('download', () => descargas++);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByLabel('Nombre del documento', { exact: true })).toHaveCount(0);
  expect(descargas).toBe(0);
  await page.getByRole('button', { name: 'Volver al viaje', exact: true }).click();
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Respaldo JSON', exact: true }).click();
  await page.getByLabel('Nombre del documento', { exact: true }).fill('Respaldo corregido.json');
  await page.getByRole('button', { name: 'Descargar', exact: true }).click();
  expect((await descarga).suggestedFilename()).toBe('Respaldo corregido.json');
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  await page.goto(compraURL);
  await expect(page.locator('.weights-grand-total')).toContainText('473.95');
  await expect(page.getByRole('button', { name: /^Editar .* kg,/ })).toHaveCount(0);
});

test('explica en la fila el bloqueo de una compra de viaje anterior cerrado', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Compra', exact: true }).click();
  await page.getByLabel('Granja', { exact: true }).fill('Stock anterior');
  await page.getByRole('option').filter({ hasText: 'Crear "Stock anterior"' }).click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  for (const key of ['2', '0', '0', '0'])
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page.goto('/#/viaje/cierre');
  await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
  await page.getByRole('button', { name: 'Venta', exact: true }).click();
  await page.getByLabel('Vendedor', { exact: true }).fill('Venta stock anterior');
  await page.getByRole('option').filter({ hasText: 'Crear "Venta stock anterior"' }).click();
  await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
  await page.getByRole('button', { name: 'Marcar 20.00 kg, 1 disponibles', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Editar 20.00 kg, Rosado, registro 1', exact: true })
    .click();
  await expect(page.locator('.peso-celda').getByRole('alert')).toContainText('viaje cerrado');
  await expect(page.getByLabel('Peso corregido', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.weights-grand-total')).toContainText('20.00');
});

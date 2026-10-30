import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const width of [320, 340, 390]) {
  test(`venta con compra: buscar no marca pesos y solo admite números a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
    await page.goto('/#/viaje/compra');
    await page.getByLabel('Granja', { exact: true }).fill('Granja buscador');
    await page.getByRole('option').filter({ hasText: 'Crear "Granja buscador"' }).click();
    await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
    for (const peso of ['1290', '1290', '2145']) {
      for (const key of peso) {
        await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
      }
    }
    await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
    await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
    await page.goto('/#/viaje/venta');
    await page.getByLabel('Vendedor', { exact: true }).fill('Venta buscador');
    await page.getByRole('option').filter({ hasText: 'Crear "Venta buscador"' }).click();
    await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();

    const input = page.getByLabel('Buscar peso (kg)', { exact: true });
    const results = page.locator('.available-panel').getByRole('button', { name: /^Marcar / });
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('inputmode', 'decimal');
    await expect(page.locator('.teclas')).toHaveCount(0);
    await expect(page.getByText('Ajustes del teclado', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Tipo de huevo', exact: true })).toHaveAttribute(
      'data-stacked',
      'false',
    );
    await expect(results).toHaveCount(2);
    await input.fill('abc-12,90 kg');
    await expect(input).toHaveValue('12.90');
    await expect(results).toHaveCount(1);
    await expect(results).toContainText('12.90 ×2');
    await input.press('Enter');
    await expect(page.locator('.capture-footer')).toContainText('0 paq.');
    await expect(page.getByRole('button', { name: 'Confirmar venta', exact: true })).toBeDisabled();

    await results.click();
    await expect(page.locator('.capture-footer')).toContainText('1 paq.');
    await expect(results).toContainText('12.90 ×1');
    await expect(input).toHaveValue('12.90');
    await results.click();
    await expect(page.locator('.capture-footer')).toContainText('2 paq.');
    await expect(results).toHaveCount(0);
    await expect(page.locator('.empty-weights')).toContainText('Sin coincidencias');
    await page.getByRole('button', { name: 'Deshacer último', exact: true }).click();
    await expect(results).toHaveCount(1);
    await expect(page.locator('.capture-footer')).toContainText('1 paq.');

    await page.getByRole('button', { name: 'Limpiar búsqueda de pesos', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(results).toHaveCount(2);
    await input.fill('99');
    await expect(results).toHaveCount(0);
    await expect(page.locator('.empty-weights')).toContainText('Sin coincidencias');
    await input.fill('21');
    await expect(results).toHaveCount(1);
    await expect(results).toContainText('21.45');
    const disponibles = await page.locator('.available-panel').boundingBox();
    const marcados = await page.locator('.marked-weights').boundingBox();
    expect(disponibles!.y).toBeLessThan(marcados!.y);
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
    await input.blur();
    await page.screenshot({ path: `test-results/buscador-venta-${width}.png`, fullPage: true });
  });
}

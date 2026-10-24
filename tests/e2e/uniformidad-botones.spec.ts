import { expect, test, type Page } from '@playwright/test';

async function revisarGrupos(page: Page) {
  const viewportWidth = 390;
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', viewportWidth);
  const groups = await page.locator('.app-button-row:visible').evaluateAll((rows) =>
    rows.map((row) => {
      const buttons = [...row.children].filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          el.classList.contains('app-button') &&
          el.getClientRects().length > 0,
      );
      return {
        layout: row.getAttribute('data-layout'),
        stacked: row.getAttribute('data-stacked') === 'true',
        buttons: buttons.map((button) => {
          const box = button.getBoundingClientRect();
          return {
            x: box.x,
            width: box.width,
            height: box.height,
            whiteSpace: getComputedStyle(button).whiteSpace,
          };
        }),
      };
    }),
  );
  for (const group of groups) {
    const boxes = group.buttons;
    if (!boxes.length) continue;
    const height = boxes[0]!.height;
    for (const box of boxes) {
      expect(Math.abs(box.height - height)).toBeLessThanOrEqual(1);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
      expect([48, 56]).toContain(Math.round(box.height));
      expect(box.whiteSpace).toBe('nowrap');
    }
    if (group.layout === 'equal' && !group.stacked)
      for (const box of boxes.slice(1))
        expect(Math.abs(box.width - boxes[0]!.width)).toBeLessThanOrEqual(1);
  }
}

test('botones y cards conservan medidas comunes en móvil, claro y oscuro', async ({ browser }) => {
  for (const dark of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.addInitScript((isDark) => localStorage.setItem('ksm-dark', String(isDark)), dark);
    await page.goto('/');
    await revisarGrupos(page);

    await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
    await revisarGrupos(page);
    await page.getByRole('button', { name: 'Compra', exact: true }).click();
    await revisarGrupos(page);
    await page.getByLabel('Granja', { exact: true }).fill('Uniformidad');
    await page.getByRole('option').filter({ hasText: 'Crear "Uniformidad"' }).click();
    await page.locator('.native-price-input').first().fill('5.00');
    await revisarGrupos(page);
    await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
    for (const key of ['1', '2', '4', '5'])
      await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
    await revisarGrupos(page);

    for (const card of await page.locator('.app-card:visible').all()) {
      const shape = await card.evaluate((el) => {
        const css = getComputedStyle(el);
        return {
          radius: css.borderRadius,
          shadow: css.boxShadow,
          border: css.borderTopWidth,
          padding: css.paddingTop,
        };
      });
      expect(shape.radius, await card.evaluate((el) => el.outerHTML)).toBe('8px');
      expect(shape.shadow).toBe('none');
      expect(shape.border).toBe('1px');
      expect(['0px', '16px']).toContain(shape.padding);
    }
    await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
    await page.getByRole('button', { name: 'Volver al viaje', exact: true }).click();
    await revisarGrupos(page);
    await page.getByRole('button', { name: 'Cerrar viaje', exact: true }).click();
    await revisarGrupos(page);
    await context.close();
  }
});

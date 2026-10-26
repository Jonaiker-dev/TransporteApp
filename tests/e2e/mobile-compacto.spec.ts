import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });
test.setTimeout(45000);
test.beforeEach(({ page }) => page.setDefaultTimeout(15000));

// Stress the layout with text enlargement. This does not emulate OS accessibility settings.
async function ampliarTexto(page: Page) {
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '24px';
    const text = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(
        (el) =>
          !el.classList.contains('q-icon') &&
          !el.dataset.compactScale &&
          (el.matches('input, textarea, select') ||
            [...el.childNodes].some(
              (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
            )),
      )
      .map((el) => {
        const css = getComputedStyle(el);
        return { el, font: parseFloat(css.fontSize), line: parseFloat(css.lineHeight) };
      });
    for (const { el, font, line } of text) {
      el.dataset.compactScale = 'true';
      el.style.fontSize = `${font * 1.3}px`;
      if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.3}px`;
    }
  });
}

async function revisarNavegacion(page: Page, width: number) {
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
  const nav = page.locator('.mobile-bottom-bar .app-button-group--navigation');
  await expect(nav.locator('.app-button-row')).toHaveAttribute('data-stacked', 'false');
  const box = await nav.boundingBox();
  expect(box!.height).toBe(64);
  const buttons = await nav.locator('.app-button').all();
  for (const button of buttons) {
    const rect = await button.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(48);
    expect(rect!.height).toBeGreaterThanOrEqual(48);
    expect(rect!.y).toBeGreaterThanOrEqual(box!.y);
    const label = button.locator('.q-btn__content > span:not(.q-icon)').first();
    if (await label.count()) {
      expect(await label.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    }
  }
  const action = page.locator('.app-button-group--above-nav');
  if (await action.count()) {
    const rect = await action.boundingBox();
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(box!.y + 1);
  }
}

for (const width of [320, 340, 390]) {
  for (const large of [false, true]) {
    test(`${width}px con texto ${large ? 'ampliado' : 'normal'}: navegar, crear y editar compra`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto('/');
      await page.getByRole('button', { name: 'Iniciar viaje', exact: true }).click();
      for (const route of [
        '/viaje',
        '/viaje/venta',
        '/viaje/flete',
        '/movimientos',
        '/viaje/compra',
      ]) {
        await page.goto(`/#${route}`);
        await expect(page.locator('.q-page')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        if (large) await ampliarTexto(page);
        await revisarNavegacion(page, width);
      }
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
        'content',
        /maximum-scale=1.*user-scalable=no/,
      );
      await expect(page.locator('html')).toHaveCSS('text-size-adjust', '100%');
      await expect(page.locator('html')).toHaveCSS('touch-action', 'pan-x pan-y');
      await page.screenshot({
        path: `test-results/formulario-${width}-${large ? 'grande' : 'normal'}.png`,
        fullPage: true,
      });
      await page.getByLabel('Granja', { exact: true }).fill('Granja compacta');
      await page.getByRole('option').filter({ hasText: 'Crear "Granja compacta"' }).click();
      for (const input of await page.locator('.native-price-input').all()) {
        const box = await input.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(70);
        await input.fill('5.20');
        await expect(input).toHaveValue('5.20');
      }
      await page.getByRole('button', { name: 'Crear y empezar a anotar' }).click();
      await expect(
        page.getByRole('heading', { name: 'Granja compacta', exact: true }),
      ).toBeVisible();
      if (large) await ampliarTexto(page);
      for (const key of '2145') {
        await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
      }
      await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
      await page.getByRole('button', { name: 'Editar precios', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      if (large) await ampliarTexto(page);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await page.getByLabel('Precio Rosado', { exact: true }).fill('6.10');
      await page.getByRole('button', { name: 'Guardar precios', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.screenshot({
        path: `test-results/compacto-${width}-${large ? 'grande' : 'normal'}.png`,
        fullPage: true,
      });
    });
  }
}

test('el gesto de pinza conserva la escala en Chromium móvil', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.synthesizePinchGesture', {
    x: 160,
    y: 300,
    scaleFactor: 2,
    gestureSourceType: 'touch',
  });
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(1);
  await cdp.detach();
});

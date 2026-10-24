import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]) {
  test(`registro permanece dentro de la pantalla ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/#/login');
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeInViewport();
    await page.getByRole('link', { name: 'Regístrate aquí' }).click();
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeInViewport();

    const form = page.locator('form');
    const bounds = await form.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    const submit = page.getByRole('button', { name: 'Registrarse', exact: true });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    await submit.click();
    await expect(form.getByRole('alert')).toHaveText('Por favor, ingresa tu nombre completo.');
    await page.getByRole('link', { name: 'Inicia sesión aquí' }).click();
    await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeInViewport();
  });
}

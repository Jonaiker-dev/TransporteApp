import { expect, test } from '@playwright/test';
declare global {
  interface Window {
    ksmTicks: number;
  }
}
test('3000 paquetes y cinco movimientos conservan captura móvil acotada', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  const id = await page.evaluate(async () => {
    const meta = () => {
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        deleted_at: null,
        synced_at: null,
      };
    };
    const viaje = {
      ...meta(),
      fecha_inicio: '2026-10-23',
      fecha_fin: null,
      estado: 'ABIERTO',
      nota: '',
    };
    const granja = {
      ...meta(),
      nombre: 'Granja rendimiento',
      nombre_norm: 'granja rendimiento',
      roles: ['GRANJA'],
    };
    const movimientos = Array.from({ length: 5 }, (_, i) => ({
      ...meta(),
      viaje_id: viaje.id,
      tipo: 'COMPRA',
      fecha: '2026-10-23',
      parte_id: granja.id,
      precios: { R: 500, P: 600, J: 700 },
      tiene_pesos_compra: true,
      estado: i === 0 ? 'EN_CURSO' : 'TERMINADO',
    }));
    const paquetes = Array.from({ length: 3000 }, (_, i) => ({
      ...meta(),
      tipo: ['R', 'P', 'J'][i % 3],
      peso_c: 2145,
      granja_id: granja.id,
      compra_mov_id: movimientos[i < 1500 ? 0 : 1 + Math.floor((i - 1500) / 375)]!.id,
      venta_mov_id: null,
      estado: 'EN_CAMION',
      origen: 'COMPRA',
      orden_captura: i + 1,
    }));
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('transporteapp');
      request.onerror = () =>
        reject(new Error(request.error?.message ?? 'No se pudo abrir la base'));
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(
          ['viajes', 'partes', 'movimientos', 'paquetes', 'settings'],
          'readwrite',
        );
        tx.objectStore('viajes').put(viaje);
        tx.objectStore('partes').put(granja);
        movimientos.forEach((m) => tx.objectStore('movimientos').put(m));
        paquetes.forEach((p) => tx.objectStore('paquetes').put(p));
        tx.objectStore('settings').put({ key: 'orden_captura', value: '3000' });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(new Error(tx.error?.message ?? 'No se pudo cargar la prueba'));
      };
    });
    return movimientos[0]!.id;
  });
  // The fixture writes through native IndexedDB, outside Dexie's liveQuery
  // notifications. Reopen the app so its shared reader loads that fixture.
  await page.goto('about:blank');
  const started = Date.now();
  await page.goto(`/#/viaje/compra/${id}`);
  await expect(page.getByRole('heading', { name: 'Granja rendimiento' })).toBeVisible();
  await expect(page.locator('.peso-celda')).toHaveCount(60);
  for (const key of ['2', '1', '4', '5'])
    await page.locator('.teclas').getByRole('button', { name: key, exact: true }).click();
  await expect(page.getByText('Último: 21.45 kg · Rosado')).toBeVisible();
  expect(Date.now() - started).toBeLessThan(10000);
  expect(await page.locator('.peso-celda').count()).toBeLessThanOrEqual(60);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.getByRole('button', { name: 'Terminar compra', exact: true }).click();
  await expect(page.getByText('Terminado', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.ksmTicks = 0;
    setInterval(() => {
      window.ksmTicks++;
    }, 25);
  });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Excel' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  expect(await page.evaluate(() => window.ksmTicks)).toBeGreaterThan(2);
  await page.screenshot({ path: 'test-results/rendimiento-mobile.png', fullPage: false });
  expect(errors).toEqual([]);
});

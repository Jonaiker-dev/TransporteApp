import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

// Always uses a temporary browser profile; never opens the user's local database.
const server = spawn(process.execPath, ['tests/serve.mjs'], { stdio: 'ignore' });
let browser;
try {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  browser = await chromium.launch(existsSync(edge) ? { executablePath: edge } : {});
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.reads = 0;
    const getAll = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      window.reads++;
      return getAll.apply(this, args);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('button', { name: 'Iniciar viaje', exact: true })).toBeVisible();
  // Seed without a mounted app to keep setup outside the measured actions.
  await page.goto('http://127.0.0.1:4173/manifest.json');
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('transporteapp');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(['viajes', 'partes', 'movimientos', 'paquetes'], 'readwrite');
    const done = new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error);
    });
    const meta = (id) => ({
      id,
      created_at: '2026-10-01T12:00:00Z',
      updated_at: '2026-10-01T12:00:00Z',
      deleted_at: null,
      synced_at: '2026-10-01T12:00:00Z',
    });
    tx.objectStore('partes').put({
      ...meta('bench-parte'),
      nombre: 'Parte de prueba',
      nombre_norm: 'parte de prueba',
      roles: ['GRANJA', 'CLIENTE'],
    });
    for (let trip = 0; trip < 12; trip++) {
      tx.objectStore('viajes').put({
        ...meta(`bench-v-${trip}`),
        fecha_inicio: '2026-10-01',
        fecha_fin: trip === 11 ? null : '2026-10-01',
        estado: trip === 11 ? 'ABIERTO' : 'CERRADO',
        nota: '',
      });
      for (let movement = 0; movement < 25; movement++) {
        const compra = `bench-c-${trip}-${movement}`;
        const venta = `bench-s-${trip}-${movement}`;
        for (const [id, tipo] of [
          [compra, 'COMPRA'],
          [venta, 'VENTA'],
        ])
          tx.objectStore('movimientos').put({
            ...meta(id),
            viaje_id: `bench-v-${trip}`,
            parte_id: 'bench-parte',
            fecha: '2026-10-01',
            tipo,
            estado: 'TERMINADO',
            precios: { R: tipo === 'COMPRA' ? 500 : 600 },
            tiene_pesos_compra: true,
          });
        for (let n = 0; n < 100; n++)
          tx.objectStore('paquetes').put({
            ...meta(`bench-p-${trip}-${movement}-${n}`),
            tipo: 'R',
            peso_c: 2145,
            granja_id: 'bench-parte',
            compra_mov_id: compra,
            venta_mov_id: venta,
            estado: 'VENDIDO',
            origen: 'COMPRA',
            orden_captura: n,
            orden_venta: n,
          });
      }
    }
    await done;
    db.close();
  });
  const results = [];
  for (const [tipo, label] of [
    ['compra', 'Granja'],
    ['venta', 'Vendedor'],
    ['flete', 'Cliente del flete'],
  ]) {
    await page.goto(`http://127.0.0.1:4173/#/viaje/${tipo}`);
    const name = `Benchmark ${tipo}`;
    await page.getByLabel(label, { exact: true }).fill(name);
    await page.getByRole('option').filter({ hasText: 'Crear' }).click();
    if (tipo === 'flete') await page.getByLabel('Rosados', { exact: true }).fill('5');
    await page.evaluate(() => {
      window.reads = 0;
      window.emptyFlashes = [];
      const monitor = new MutationObserver(() => {
        if (
          /No se encontró el movimiento|No hay movimientos en este viaje/.test(
            document.body.innerText,
          )
        )
          window.emptyFlashes.push('Contenido vacío durante la creación');
      });
      monitor.observe(document.body, { childList: true, subtree: true });
    });
    const start = performance.now();
    await page
      .getByRole('button', {
        name: tipo === 'flete' ? 'Registrar flete' : 'Crear y empezar a anotar',
        exact: true,
      })
      .click();
    if (tipo === 'flete')
      await expect(page.locator('.movimiento-card').filter({ hasText: name })).toBeVisible({
        timeout: 30000,
      });
    else
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible({
        timeout: 30000,
      });
    const elapsed = Math.round(performance.now() - start);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.emptyFlashes)).toEqual([]);
    results.push({ tipo, ms: elapsed, lecturasGetAll: await page.evaluate(() => window.reads) });
  }
  // Reload must retain the three new movements and the seeded history.
  await page.reload();
  for (const tipo of ['compra', 'venta', 'flete'])
    await expect(
      page.locator('.movimiento-card').filter({ hasText: `Benchmark ${tipo}` }),
    ).toBeVisible();
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify({ historial: { viajes: 12, movimientos: 600, paquetes: 30000 }, results }),
  );
} finally {
  await browser?.close();
  server.kill();
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, type EffectScope } from 'vue';
import type { Snapshot } from '../repositories/transporte';
import { observar } from '../repositories/transporte';
import { useTransporte } from './useTransporte';
import { metadata } from '../domain/model';

vi.mock('../repositories/transporte', () => ({ observar: vi.fn() }));
const scopes: EffectScope[] = [];
function consumer() {
  const scope = effectScope();
  scopes.push(scope);
  return { scope, state: scope.run(() => useTransporte())! };
}
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop();
  vi.clearAllMocks();
});

describe('lectura local compartida', () => {
  it('comparte la suscripción y conserva datos al navegar entre pantallas', () => {
    const unsubscribe = vi.fn();
    vi.mocked(observar).mockReturnValue({ unsubscribe, closed: false });
    const app = consumer();
    const state: Snapshot = {
      viajes: [],
      partes: [],
      movimientos: [],
      paquetes: [],
      fletes: [],
      pendientes: 3,
    };
    vi.mocked(observar).mock.calls[0]![0](state);
    const page = consumer();
    expect(observar).toHaveBeenCalledTimes(1);
    expect(page.state.data.value).toBe(state);
    expect(page.state.ready.value).toBe(true);
    page.scope.stop();
    expect(unsubscribe).not.toHaveBeenCalled();
    const nextPage = consumer();
    expect(nextPage.state.data.value).toBe(state);
    expect(observar).toHaveBeenCalledTimes(1);
    app.scope.stop();
    nextPage.scope.stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    const restart = consumer();
    expect(observar).toHaveBeenCalledTimes(2);
    expect(restart.state.ready.value).toBe(false);
    expect(restart.state.data.value.pendientes).toBe(0);
  });

  it('publica los errores de lectura a todos los consumidores', () => {
    vi.mocked(observar).mockReturnValue({ unsubscribe: vi.fn(), closed: false });
    const app = consumer();
    const page = consumer();
    vi.mocked(observar).mock.calls[0]![1](new Error('No disponible'));
    expect(app.state.error.value).toBe('No disponible');
    expect(page.state.error.value).toBe('No disponible');
    expect(page.state.ready.value).toBe(true);
  });

  it('espera la publicación local del movimiento sin abrir otra lectura', async () => {
    vi.mocked(observar).mockReturnValue({ unsubscribe: vi.fn(), closed: false });
    const app = consumer();
    const done = vi.fn();
    const waiting = app.state.esperarMovimiento('nuevo').then(done);
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    vi.mocked(observar).mock.calls[0]![0]({
      viajes: [],
      partes: [],
      paquetes: [],
      fletes: [],
      pendientes: 1,
      movimientos: [
        {
          ...metadata(),
          id: 'nuevo',
          viaje_id: 'viaje',
          parte_id: 'parte',
          tipo: 'COMPRA',
          fecha: '2026-10-24',
          precios: {},
          estado: 'EN_CURSO',
          tiene_pesos_compra: true,
        },
      ],
    });
    await waiting;
    expect(done).toHaveBeenCalledTimes(1);
    expect(observar).toHaveBeenCalledTimes(1);
    await app.state.esperarMovimiento('nuevo');
  });

  it('rechaza la espera si la lectura local falla', async () => {
    vi.mocked(observar).mockReturnValue({ unsubscribe: vi.fn(), closed: false });
    const app = consumer();
    const waiting = app.state.esperarMovimiento('nuevo');
    vi.mocked(observar).mock.calls[0]![1](new Error('Error de lectura'));
    await expect(waiting).rejects.toThrow('Error de lectura');
  });
});

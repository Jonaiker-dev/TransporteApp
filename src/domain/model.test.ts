import { expect, it } from 'vitest';
import { diaViaje, fechaLima, normalizarNombre } from './model';
it('busca nombres sin tildes y calcula días usando el calendario de Lima', () => {
  expect(normalizarNombre('  GRANJA Águila  ')).toBe('granja aguila');
  expect(fechaLima(new Date('2026-10-24T03:30:00Z'))).toBe('2026-10-23');
  expect(diaViaje('2026-10-21', '2026-10-23')).toBe(3);
  expect(diaViaje('2026-10-23', '2026-10-23')).toBe(1);
});

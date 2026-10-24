import test from 'node:test';
import assert from 'node:assert/strict';
import { checkTemplate, checkStyles, checkStylesheet } from './check-ui.mjs';

test('rechaza botones y cards nativos fuera de sus wrappers', () => {
  const source = '<template><q-btn label="Roto"/><button>Roto</button><q-card/></template>';
  const errors = checkTemplate(source, 'src/pages/Fixture.vue');
  assert.equal(errors.length, 3);
});

test('permite solo los dos tamaños del contrato AppButton', () => {
  const valid = '<template><AppButton size="md"/><AppButton size="lg"/></template>';
  const invalid = '<template><AppButton size="sm"/></template>';
  assert.deepEqual(checkTemplate(valid, 'src/pages/Fixture.vue'), []);
  assert.match(checkTemplate(invalid, 'src/pages/Fixture.vue').join(), /tamaño AppButton inválido/);
});

test('rechaza dimensiones de botón y card fuera de los componentes dueños', () => {
  const button = '<template/><style>.app-button { height: 20px; }</style>';
  const card = '<template/><style>.app-card { padding: 2px; }</style>';
  assert.match(checkStyles(button, 'src/pages/Fixture.vue').join(), /dimensiones de AppButton/);
  assert.match(checkStyles(card, 'src/pages/Fixture.vue').join(), /forma de AppCard/);
});

test('rechaza reglas globales para botones nativos y clases personalizadas', () => {
  const errors = checkStylesheet('button { height: 28px; } .btn-wide { padding: 4px; }', 'src/css/app.css');
  assert.equal(errors.length, 2);
});

test('permite las tres teclas nativas de la rejilla de captura', () => {
  const source = '<template><div class="teclas"><button>1</button><button>2</button></div></template><style>.teclas button { height: 48px; }</style>';
  assert.deepEqual(checkTemplate(source, 'src/components/TecladoPesos.vue'), []);
  assert.deepEqual(checkStyles(source, 'src/components/TecladoPesos.vue'), []);
});

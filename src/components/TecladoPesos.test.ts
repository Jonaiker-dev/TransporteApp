import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import Teclado from './TecladoPesos.vue';
it('12.4 + Agregar entrega 12.40 y cuatro dígitos entregan 21.45', async () => {
  const wrapper = mount(Teclado, {
    global: {
      stubs: {
        QBtn: {
          template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
          props: ['label'],
        },
        QCard: { template: '<div><slot /></div>' },
        QIcon: true,
        QSpinner: true,
        'q-toggle': true,
      },
    },
  });
  for (const key of ['1', '2', '.', '4'])
    await wrapper
      .findAll('.teclas button')
      .find((b) => b.text() === key)!
      .trigger('click');
  await wrapper
    .findAll('button')
    .find((b) => b.text() === 'Agregar')!
    .trigger('click');
  expect(wrapper.emitted('submit')?.[0]).toEqual([1240]);
  for (const key of ['2', '1', '4', '5'])
    await wrapper
      .findAll('.teclas button')
      .find((b) => b.text() === key)!
      .trigger('click');
  expect(wrapper.emitted('submit')?.[1]).toEqual([2145]);
  wrapper.unmount();
});

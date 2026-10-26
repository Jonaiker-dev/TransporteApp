<template>
  <div
    class="app-button-group"
    :class="{
      'app-button-group--fixed': fixed,
      'app-button-group--above-nav': aboveNavigation,
      'app-button-group--summary': $slots.summary,
      'app-button-group--navigation': navigation,
    }"
  >
    <div v-if="$slots.summary" class="app-button-summary"><slot name="summary" /></div>
    <div
      ref="row"
      class="app-button-row"
      role="group"
      :aria-label="label"
      :data-size="size"
      :data-stacked="stacked"
      :data-layout="columns === 2 ? layout : 'equal'"
      :style="{ '--app-button-columns': columns }"
    >
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
const props = withDefaults(
  defineProps<{
    size?: 'md' | 'lg';
    layout?: 'equal' | 'primary-first';
    maxColumns?: number;
    fixed?: boolean;
    aboveNavigation?: boolean;
    navigation?: boolean;
    label?: string;
  }>(),
  {
    size: 'md',
    layout: 'equal',
    maxColumns: 99,
    fixed: false,
    aboveNavigation: false,
    navigation: false,
    label: 'Acciones',
  },
);
const row = ref<HTMLElement>();
const stacked = ref(false);
const columns = ref(1);
let resize: ResizeObserver | undefined;
let mutations: MutationObserver | undefined;
let frame = 0;
function measure() {
  const host = row.value;
  if (!host || !host.clientWidth) return;
  const buttons = [...host.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('app-button'),
  );
  const count = Math.max(1, Math.min(buttons.length, props.maxColumns));
  columns.value = count;
  // Navigation has a reserved 64px height in the layout and must never stack.
  if (props.navigation) {
    stacked.value = false;
    return;
  }
  const gap = parseFloat(getComputedStyle(host).columnGap) || 0;
  const available = host.clientWidth - gap * (count - 1);
  const weighted = props.layout === 'primary-first' && count === 2;
  stacked.value = buttons.some((button, i) => {
    const clone = button.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: 'fixed',
      left: '-10000px',
      top: '0',
      visibility: 'hidden',
      width: 'max-content',
      minWidth: '48px',
      maxWidth: 'none',
    });
    clone.setAttribute('aria-hidden', 'true');
    document.body.appendChild(clone);
    const required = clone.getBoundingClientRect().width;
    clone.remove();
    const fraction = weighted ? (i % count === 0 ? 2 / 3 : 1 / 3) : 1 / count;
    return required > available * fraction + 0.5;
  });
}
function schedule() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(measure);
}
onMounted(() => {
  if (!row.value) return;
  resize = new ResizeObserver(schedule);
  resize.observe(row.value);
  mutations = new MutationObserver(schedule);
  mutations.observe(row.value, { childList: true, characterData: true, subtree: true });
  measure();
  void document.fonts.ready.then(schedule);
});
onBeforeUnmount(() => {
  resize?.disconnect();
  mutations?.disconnect();
  cancelAnimationFrame(frame);
});
</script>
<style scoped lang="scss">
.app-button-group {
  min-width: 0;
}
.app-button-row {
  --app-button-row-height: #{$app-button-height-md};
  display: grid;
  grid-template-columns: repeat(var(--app-button-columns, 1), minmax(0, 1fr));
  align-items: stretch;
  gap: $app-button-gap;
  min-width: 0;
}
.app-button-row[data-size='lg'] {
  --app-button-row-height: #{$app-button-height-lg};
}
.app-button-row[data-layout='primary-first']:not([data-stacked='true']) {
  grid-template-columns: 2fr 1fr;
}
.app-button-row[data-stacked='true'] {
  grid-template-columns: minmax(0, 1fr);
}
.app-button-row :deep(> .app-button) {
  width: 100%;
  min-width: 0;
}
.app-button-group--fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  width: 100%;
  max-width: 480px;
  margin-inline: auto;
  padding: $app-button-bar-padding calc(#{$app-button-bar-padding})
    calc(#{$app-button-bar-padding} + env(safe-area-inset-bottom));
  background: var(--ksm-card);
  border-top: 1px solid var(--ksm-border);
}
.app-button-group--navigation {
  padding: $app-button-nav-padding 0 calc(#{$app-button-nav-padding} + env(safe-area-inset-bottom));
}
.app-button-group--navigation .app-button-row {
  gap: 0;
}
.app-button-group--above-nav {
  bottom: calc(64px + env(safe-area-inset-bottom));
}
.app-button-group--summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: $app-button-gap;
}
.app-button-summary {
  min-width: 0;
}
@media (min-width: 1024px) {
  .app-button-group--above-nav {
    bottom: 0;
  }
}
</style>

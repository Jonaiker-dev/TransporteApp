<template>
  <q-btn
    v-bind="forwardAttrs()"
    class="app-button"
    :class="{
      'app-button--block': block,
      'app-button--icon': isIconOnly,
      'app-button--stack': stack,
    }"
    :data-size="size"
    :data-variant="variant"
    :data-tone="tone"
    :label="label"
    :icon="icon"
    :icon-right="iconRight"
    :to="to"
    :href="href"
    :target="target"
    :rel="rel"
    :type="type"
    :disable="disabled"
    :loading="loading"
    :stack="stack"
    :aria-busy="loading || undefined"
    no-caps
    unelevated
    ><slot
  /></q-btn>
</template>
<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue';
import { QBtn, type QBtnProps } from 'quasar';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    size?: 'md' | 'lg';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    block?: boolean;
    iconOnly?: boolean;
    stack?: boolean;
    disabled?: boolean;
    loading?: boolean;
    label?: QBtnProps['label'];
    icon?: string | undefined;
    iconRight?: string | undefined;
    to?: QBtnProps['to'];
    href?: string | undefined;
    target?: string | undefined;
    rel?: string | undefined;
    type?: 'button' | 'submit' | 'reset';
    tone?: 'R' | 'P' | 'J' | undefined;
  }>(),
  {
    size: 'md',
    variant: 'primary',
    block: false,
    iconOnly: false,
    stack: false,
    disabled: false,
    loading: false,
    type: 'button',
  },
);
const attrs = useAttrs();
const slots = useSlots();
const isIconOnly = computed(
  () => props.iconOnly || Boolean(props.icon && !props.label && !slots.default),
);
const forbidden = new Set([
  'padding',
  'dense',
  'round',
  'flat',
  'outline',
  'unelevated',
  'color',
  'text-color',
  'textColor',
  'style',
  'size',
]);
function forwardAttrs() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => !forbidden.has(key)));
}
</script>
<style scoped lang="scss">
.q-btn.app-button {
  --app-button-height: #{$app-button-height-md};
  height: var(--app-button-row-height, var(--app-button-height));
  min-height: var(--app-button-row-height, var(--app-button-height));
  max-height: var(--app-button-row-height, var(--app-button-height));
  min-width: #{$app-button-height-md};
  max-width: 100%;
  padding: 0 $app-button-padding-x;
  border: $app-button-border-width solid transparent;
  border-radius: $app-button-radius;
  background: var(--ksm-primary);
  color: var(--ksm-on-solid);
  font-size: $app-button-font-size;
  line-height: $app-button-line-height;
  font-weight: $app-button-font-weight;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  box-shadow: none;
  touch-action: manipulation;
}
.app-button[data-size='lg'] {
  --app-button-height: #{$app-button-height-lg};
}
.q-btn.app-button[data-variant='secondary'] {
  background: var(--ksm-card);
  color: var(--ksm-text);
  border-color: var(--ksm-border);
}
.q-btn.app-button[data-variant='ghost'] {
  background: transparent;
  color: var(--ksm-text);
}
.q-btn.app-button[data-variant='danger'] {
  background: var(--ksm-negative);
  color: var(--ksm-on-solid);
}
.q-btn.app-button[data-tone='R'] {
  background: var(--egg-r-bg);
  color: var(--egg-r);
}
.q-btn.app-button[data-tone='P'] {
  background: var(--egg-p-bg);
  color: var(--egg-p);
}
.q-btn.app-button[data-tone='J'] {
  background: var(--egg-j-bg);
  color: var(--egg-j);
}
.q-btn.app-button[aria-pressed='true'] {
  border-color: currentColor;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.q-btn.app-button.is-active {
  border-color: currentColor;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.q-btn.app-button.disabled {
  opacity: 1 !important;
  background: var(--ksm-disabled-bg);
  color: var(--ksm-disabled-text);
  border-color: var(--ksm-border);
}
.q-btn.app-button:focus-visible {
  outline: 3px solid var(--ksm-primary);
  outline-offset: 3px;
}
.q-btn.app-button:active:not(.disabled) {
  outline: 2px solid currentColor;
  outline-offset: -3px;
}
.q-btn.app-button--block {
  width: 100%;
}
.q-btn.app-button--icon {
  width: var(--app-button-row-height, var(--app-button-height));
  padding: 0;
}
.app-button :deep(.q-btn__content) {
  flex-wrap: nowrap;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
  gap: $app-button-content-gap;
  overflow: hidden;
}
.app-button :deep(.q-btn__content > span:not(.q-icon):not(.q-spinner)) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-button :deep(.q-icon) {
  font-size: $app-button-icon-size;
  flex-shrink: 0;
}
.app-button :deep(.q-icon.on-left),
.app-button :deep(.q-icon.on-right) {
  margin: 0;
}
.app-button :deep(strong),
.app-button :deep(small) {
  font: inherit;
}
.app-button--stack :deep(.q-btn__content) {
  gap: 0;
  flex-direction: column;
}
.q-btn.app-button--stack {
  padding-inline: 4px;
}
.app-button--stack :deep(.q-icon) {
  font-size: $app-button-stack-icon-size;
}
</style>

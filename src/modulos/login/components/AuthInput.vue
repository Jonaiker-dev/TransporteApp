<template>
  <div class="auth-input-group q-mb-md">
    <label v-if="label" class="auth-label block text-weight-medium">
      {{ label }}
    </label>

    <div
      class="auth-input-container row items-center no-wrap"
      :class="{
        'is-focused': isFocused,
        'has-error': !!errorMessage,
      }"
    >
      <q-icon
        v-if="icon"
        :name="icon"
        size="21px"
        class="left-icon q-mr-sm"
        :color="isFocused ? 'primary' : 'blue-grey-4'"
      />

      <input
        :id="inputId"
        :value="modelValue"
        :type="computedType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="native-input col"
        @input="onInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <AppButton
        v-if="isPassword"
        type="button"
        tabindex="-1"
        aria-label="Alternar visibilidad de contraseña"
        @click="showPassword = !showPassword"
        variant="ghost"
        size="md"
        class="flex flex-center"
        icon-only
      >
        <q-icon
          :name="showPassword ? 'visibility_off' : 'visibility'"
          size="20px"
          color="blue-grey-5"
        />
      </AppButton>
    </div>

    <div v-if="errorMessage" class="error-text text-negative q-mt-xs text-caption">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string | undefined;
    label?: string | undefined;
    placeholder?: string | undefined;
    type?: string | undefined;
    icon?: string | undefined;
    isPassword?: boolean | undefined;
    errorMessage?: string | undefined;
    autocomplete?: string | undefined;
  }>(),
  {
    modelValue: '',
    label: '',
    placeholder: '',
    type: 'text',
    icon: '',
    isPassword: false,
    errorMessage: '',
    autocomplete: 'off',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const inputId = `auth-input-${Math.random().toString(36).substring(2, 9)}`;
const isFocused = ref(false);
const showPassword = ref(false);

const computedType = computed(() => {
  if (props.isPassword) {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}
</script>

<style scoped>
.auth-input-group {
  width: 100%;
}

.auth-label {
  font-size: 0.86rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 7px;
  letter-spacing: -0.01em;
}

.auth-input-container {
  height: 52px;
  background-color: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 0 14px;
  transition: all 0.22s ease-in-out;
}

.auth-input-container:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.auth-input-container.is-focused {
  background-color: #ffffff;
  border-color: #1976d2;
  box-shadow: 0 0 0 3.5px rgba(25, 118, 210, 0.14);
}

.auth-input-container.has-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.native-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: max(16px, 1rem);
  color: #0f172a;
  width: 100%;
  font-family: inherit;
}

.native-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.left-icon {
  transition: color 0.2s ease;
}

.error-text {
  font-size: 0.76rem;
  line-height: 1.2;
}
</style>

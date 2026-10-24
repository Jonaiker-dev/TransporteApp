import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [vue()],
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    environment: 'jsdom',
    maxWorkers: 1,
  },
});

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  server: { port: 5273, strictPort: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
});

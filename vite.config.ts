import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    pool: 'threads',
    maxWorkers: 1,
    isolate: false,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['tests/e2e/**', 'hidden/**', 'node_modules/**'],
  },
});
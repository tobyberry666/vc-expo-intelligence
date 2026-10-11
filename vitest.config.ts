import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/features/**/*.ts',
        'src/hooks/useFavorites.ts',
        'src/hooks/useLiveFeed.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
});

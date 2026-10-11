import { globalIgnores } from 'eslint/config';
import { eslintPresets } from '@lark-apaas/coding-presets-react';

export default [
  globalIgnores([
    'dist',
    'dist-platform',
    'coverage',
    'playwright-report',
    'test-results',
    '**/components/ui/**',
  ]),
  ...eslintPresets.client.map((config) =>
    config.files
      ? config
      : {
          ...config,
          files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
        },
  ),
];

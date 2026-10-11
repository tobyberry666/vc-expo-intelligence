import { defineConfig, devices } from '@playwright/test';
const basePath = process.env.CLIENT_BASE_PATH ?? '/';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer:
    process.env.PLAYWRIGHT_EXTERNAL_SERVER === '1'
      ? undefined
      : {
          command:
            'node node_modules/vite/bin/vite.js preview --config vite.standalone.config.ts --host 127.0.0.1 --strictPort --port 4173',
          url: `http://127.0.0.1:4173${basePath}`,
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        },
});

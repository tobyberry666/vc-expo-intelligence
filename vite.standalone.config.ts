import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const configuredBase =
    process.env.CLIENT_BASE_PATH ||
    loadEnv(mode, process.cwd(), '').CLIENT_BASE_PATH ||
    '/';
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*\/?$/.test(configuredBase))
    throw new Error(
      'CLIENT_BASE_PATH must be an absolute URL path such as /vc-expo-intelligence/',
    );
  const base = `${configuredBase.replace(/\/+$/, '')}/`;
  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        {
          find: '@/infrastructure/runtime',
          replacement: fileURLToPath(
            new URL(
              './src/infrastructure/standalone-runtime.tsx',
              import.meta.url,
            ),
          ),
        },
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: '@shared',
          replacement: fileURLToPath(new URL('./shared', import.meta.url)),
        },
      ],
    },
    define: { 'process.env.CLIENT_BASE_PATH': JSON.stringify(base) },
    server: { host: '127.0.0.1', strictPort: true },
    preview: { host: '127.0.0.1', strictPort: true },
  };
});

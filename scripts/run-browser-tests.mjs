import { preview } from 'vite';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Own the server directly: Windows process-tree cleanup of shell-spawned servers
// can fail in restricted environments. Never terminate a port's existing owner.
const server = await preview({
  configFile: fileURLToPath(
    new URL('../vite.standalone.config.ts', import.meta.url),
  ),
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
try {
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
      ),
      'test',
      ...process.argv.slice(2),
    ],
    {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        PLAYWRIGHT_EXTERNAL_SERVER: '1',
        CLIENT_BASE_PATH: server.config.base,
      },
    },
  );
  const interrupt = () => child.kill();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    process.exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) => resolve(code ?? 1));
    });
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
} finally {
  server.httpServer.closeAllConnections();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

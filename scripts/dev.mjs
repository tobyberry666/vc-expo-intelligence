#!/usr/bin/env node
import { createServer, loadEnv } from 'vite';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const { values } = parseArgs({
  options: { port: { type: 'string' }, host: { type: 'string' } },
});
const root = fileURLToPath(new URL('..', import.meta.url));
const env = { ...loadEnv('development', root, ''), ...process.env };
const rawPort = values.port ?? env.CLIENT_DEV_PORT ?? '8001';
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  throw new Error(
    'CLIENT_DEV_PORT / --port must be an integer from 1 to 65535',
  );
}
const configFile = fileURLToPath(
  new URL(
    env.MIAODA_BUILD === '1'
      ? '../vite.config.ts'
      : '../vite.standalone.config.ts',
    import.meta.url,
  ),
);
const server = await createServer({
  root,
  configFile,
  server: {
    port: Number(rawPort),
    host: values.host ?? env.CLIENT_DEV_HOST ?? '127.0.0.1',
    strictPort: true,
  },
});
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await server.close();
  process.exit(0);
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
await server.listen();
server.printUrls();

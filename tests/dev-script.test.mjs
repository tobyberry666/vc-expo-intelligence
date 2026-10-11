import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
function run(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/dev.mjs', '--port', port], {
      windowsHide: true,
    });
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stderr }));
  });
}
test('invalid ports fail without shell execution', async () => {
  const result = await run('8001; invalid');
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /integer/);
});
test('occupied ports fail while the owning server remains alive', async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await run(String(server.address().port));
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /already in use/);
    assert.equal(server.listening, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

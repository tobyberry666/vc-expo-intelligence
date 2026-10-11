import { expect, it, vi, afterEach } from 'vitest';
import { fetchPublicFeed } from '../src/features/feed/public-feed';
import { fixtureCache } from './fixtures';
afterEach(() => vi.unstubAllGlobals());
it('rejects malformed and empty snapshots', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
  await expect(fetchPublicFeed(new AbortController().signal)).rejects.toThrow();
});
it('does not silently turn HTTP errors into zero events', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('', { status: 503 })),
  );
  await expect(fetchPublicFeed(new AbortController().signal)).rejects.toThrow();
});
const snapshot = (updatedAt = Date.now()) => ({
  ...fixtureCache(),
  updatedAt,
  warning: null,
});
it('loads valid records with canonical IDs and original collection time', async () => {
  const data = snapshot();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(data))),
  );
  const result = await fetchPublicFeed(new AbortController().signal);
  expect(result.updatedAt).toBe(data.updatedAt);
  expect(result.liveInvestments[0].id).toMatch(/^live-inv-v1-/);
  expect(result.liveExpos[0].id).toMatch(/^live-expo-v1-/);
  expect(result.warning).toBeNull();
});
it('warns about stale data without pretending it is fresh', async () => {
  const data = snapshot(Date.now() - 4 * 3600000);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(data))),
  );
  const result = await fetchPublicFeed(new AbortController().signal);
  expect(result.updatedAt).toBe(data.updatedAt);
  expect(result.warning).toContain('3 小时');
});
it('rejects future timestamps, unsafe URLs and oversized responses', async () => {
  for (const data of [
    snapshot(Date.now() + 3600000),
    {
      ...snapshot(),
      liveInvestments: [
        {
          ...fixtureCache().liveInvestments[0],
          sourceUrl: 'javascript:alert(1)',
        },
      ],
    },
  ]) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(data))),
    );
    await expect(
      fetchPublicFeed(new AbortController().signal),
    ).rejects.toThrow();
  }
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(' '.repeat(2000001))),
  );
  await expect(fetchPublicFeed(new AbortController().signal)).rejects.toThrow();
});

import { expect, it, vi, afterEach } from 'vitest';
afterEach(() => vi.useRealTimers());
import { createFeedStore } from '../src/features/feed/store';
import type { FeedResult } from '../src/features/feed/service';

const data = (summary = 'good'): FeedResult => ({
  fullSummary: summary,
  liveInvestments: [],
  liveExpos: [],
  warning: null,
});
it('polls once per store and stops after the last subscriber leaves', async () => {
  vi.useFakeTimers();
  const loader = vi.fn().mockResolvedValue(data());
  const store = createFeedStore(loader, storage(), 0, 1000);
  const offOne = store.subscribe(() => {});
  const offTwo = store.subscribe(() => {});
  await store.ensureLoaded();
  await vi.advanceTimersByTimeAsync(1000);
  expect(loader).toHaveBeenCalledTimes(2);
  offOne();
  await vi.advanceTimersByTimeAsync(1000);
  expect(loader).toHaveBeenCalledTimes(3);
  offTwo();
  await vi.advanceTimersByTimeAsync(3000);
  expect(loader).toHaveBeenCalledTimes(3);
});
it('preserves snapshot collection time rather than browser fetch time', async () => {
  const timestamp = Date.now() - 7200000;
  const store = createFeedStore(
    async () => ({ ...data(), updatedAt: timestamp }),
    storage(),
    0,
  );
  await store.refresh();
  expect(store.getSnapshot().lastUpdate).toBe(timestamp);
  expect(store.getCache()?.timestamp).toBe(timestamp);
});
it('authoritative snapshots remove expired events instead of retaining old entries', async () => {
  const { fixtureCache } = await import('./fixtures');
  const map = storage();
  map.setItem('__live_feed_cache', JSON.stringify(fixtureCache()));
  const store = createFeedStore(
    async () => ({ ...data(), updatedAt: Date.now() }),
    map,
    0,
  );
  await store.refresh();
  expect(store.getSnapshot().liveExpos).toEqual([]);
  expect(store.getSnapshot().liveInvestments).toEqual([]);
});
function storage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}
it('shares a single load and publishes results to every subscriber', async () => {
  let finish!: (value: FeedResult) => void;
  const loader = vi.fn(
    () =>
      new Promise<FeedResult>((resolve) => {
        finish = resolve;
      }),
  );
  const store = createFeedStore(loader, storage());
  const listener = vi.fn();
  store.subscribe(listener);
  const first = store.ensureLoaded();
  const second = store.ensureLoaded();
  expect(loader).toHaveBeenCalledTimes(1);
  finish(data());
  await Promise.all([first, second]);
  expect(store.getSnapshot()).toMatchObject({
    fullSummary: 'good',
    isLoading: false,
    hasData: true,
  });
  expect(listener).toHaveBeenCalled();
});
it('keeps good data when a refresh fails', async () => {
  const loader = vi
    .fn()
    .mockResolvedValueOnce(data())
    .mockRejectedValueOnce(new Error('network'));
  const store = createFeedStore(loader, storage());
  await store.refresh();
  await store.refresh();
  expect(store.getSnapshot()).toMatchObject({
    fullSummary: 'good',
    isLoading: false,
  });
  expect(store.getSnapshot().error).toContain('失败');
});
it('ignores a slow obsolete result after a newer refresh', async () => {
  let oldFinish!: (value: FeedResult) => void;
  const loader = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<FeedResult>((resolve) => {
          oldFinish = resolve;
        }),
    )
    .mockResolvedValueOnce(data('new'));
  const store = createFeedStore(loader, storage());
  const old = store.refresh();
  await store.refresh();
  oldFinish(data('old'));
  await old;
  expect(store.getSnapshot().fullSummary).toBe('new');
});
it('serves in-memory results even when persistent storage is blocked', async () => {
  const store = createFeedStore(async () => data(), {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  });
  await store.refresh();
  expect(store.getSnapshot().fullSummary).toBe('good');
  expect(store.getSnapshot().error).toContain('缓存');
});

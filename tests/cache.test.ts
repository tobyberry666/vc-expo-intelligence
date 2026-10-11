import { beforeEach, expect, it } from 'vitest';
import { loadLiveFeedCache } from '../src/hooks/useLiveFeed';
import {
  readFeedCache,
  writeFeedCache,
  CACHE_KEY,
  CACHE_TTL,
} from '../src/features/feed/cache';
import { fixtureCache, memoryStorage } from './fixtures';

beforeEach(() => localStorage.clear());
it.each([
  null,
  {},
  {
    version: 3,
    timestamp: Date.now(),
    fullSummary: 'text',
    liveInvestments: 'bad',
    liveExpos: [],
  },
  {
    version: 3,
    timestamp: Date.now() + 100000,
    fullSummary: '',
    liveInvestments: [],
    liveExpos: [],
  },
])('rejects malformed or future cache: %j', (value) => {
  localStorage.setItem('__live_feed_cache', JSON.stringify(value));
  expect(loadLiveFeedCache()).toBeNull();
});

it('migrates known positional IDs and roundtrips a validated cache', () => {
  const storage = memoryStorage();
  storage.setItem(CACHE_KEY, JSON.stringify(fixtureCache()));
  const cached = readFeedCache(storage)!;
  expect(cached.version).toBe(4);
  expect(cached.legacyIds['investment:live-inv-0']).toBe(
    cached.liveInvestments[0].id,
  );
  expect(cached.legacyIds['expo:live-expo-0']).toBe(cached.liveExpos[0].id);
  expect(writeFeedCache(cached, storage)).toBe(true);
  expect(readFeedCache(storage)).toEqual(cached);
});
it('allows bounded stale data only when explicitly requested', () => {
  const storage = memoryStorage();
  storage.setItem(
    CACHE_KEY,
    JSON.stringify(fixtureCache(Date.now() - CACHE_TTL * 2)),
  );
  expect(readFeedCache(storage)).toBeNull();
  expect(readFeedCache(storage, true)).not.toBeNull();
  storage.setItem(
    CACHE_KEY,
    JSON.stringify(fixtureCache(Date.now() - CACHE_TTL * 31)),
  );
  expect(readFeedCache(storage, true)).toBeNull();
});
it('rejects unsupported versions, invalid field shapes, and oversized storage', () => {
  const storage = memoryStorage();
  for (const value of [
    { ...fixtureCache(), version: 99 },
    {
      ...fixtureCache(),
      liveExpos: [
        { ...fixtureCache().liveExpos[0], chineseExhibitorCount: -1 },
      ],
    },
  ]) {
    storage.setItem(CACHE_KEY, JSON.stringify(value));
    expect(readFeedCache(storage)).toBeNull();
  }
  storage.setItem(CACHE_KEY, 'x'.repeat(2000001));
  expect(readFeedCache(storage)).toBeNull();
  storage.setItem(CACHE_KEY, '{');
  expect(readFeedCache(storage)).toBeNull();
  const badStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  expect(readFeedCache(badStorage)).toBeNull();
  expect(
    writeFeedCache(
      { ...fixtureCache(), version: 4, legacyIds: {} },
      badStorage,
    ),
  ).toBe(false);
  expect(
    writeFeedCache(
      {
        ...fixtureCache(),
        version: 4,
        legacyIds: {},
        fullSummary: 'x'.repeat(1000001),
      },
      storage,
    ),
  ).toBe(false);
});

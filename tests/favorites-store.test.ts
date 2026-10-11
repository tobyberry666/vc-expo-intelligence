import { expect, it, vi } from 'vitest';
import {
  createFavoritesStore,
  readFavorites,
  FAVORITES_KEY,
} from '../src/features/favorites/store';
import { CACHE_KEY, readFeedCache } from '../src/features/feed/cache';
import { fixtureCache, memoryStorage } from './fixtures';

it('migrates only favorites whose legacy ID has a validated cache mapping', () => {
  const storage = memoryStorage();
  storage.setItem(CACHE_KEY, JSON.stringify(fixtureCache()));
  storage.setItem(
    FAVORITES_KEY,
    JSON.stringify([
      { id: 'live-inv-0', type: 'investment', favoritedAt: 1 },
      { id: 'live-inv-9', type: 'investment', favoritedAt: 2 },
    ]),
  );
  const items = readFavorites(storage);
  expect(items[0].id).toBe(readFeedCache(storage)!.liveInvestments[0].id);
  expect(items[1].id).toBe('live-inv-9');
  storage.setItem(
    CACHE_KEY,
    JSON.stringify({ ...readFeedCache(storage)!, liveInvestments: [] }),
  );
  expect(readFavorites(storage)[0].id).toBe(items[0].id);
});
it('retains session favorites across remounts when storage fails', () => {
  const store = createFavoritesStore({
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  });
  const unsubscribe = store.subscribe(vi.fn());
  store.toggleFavorite('item', 'expo');
  unsubscribe();
  const finish = store.subscribe(vi.fn());
  expect(store.getSnapshot().favorites).toHaveLength(1);
  expect(store.getSnapshot().error).toContain('会话');
  finish();
});
it('handles remove, toggle off, clear and cross-tab changes', () => {
  const storage = memoryStorage();
  const store = createFavoritesStore(storage);
  const finish = store.subscribe(vi.fn());
  store.toggleFavorite('a', 'expo');
  store.toggleFavorite('a', 'expo');
  expect(store.getSnapshot().favorites).toEqual([]);
  store.toggleFavorite('a', 'expo');
  store.removeFavorite('a', 'expo');
  expect(store.getSnapshot().favorites).toEqual([]);
  store.toggleFavorite('b', 'investment');
  store.clearAll();
  expect(store.getSnapshot().favorites).toEqual([]);
  storage.setItem(
    FAVORITES_KEY,
    JSON.stringify([{ id: 'c', type: 'expo', favoritedAt: 1 }]),
  );
  window.dispatchEvent(new StorageEvent('storage'));
  expect(store.getSnapshot().favorites[0].id).toBe('c');
  store.toggleFavorite('', 'expo');
  expect(store.getSnapshot().favorites).toHaveLength(1);
  finish();
});
it('rejects oversized, malformed and duplicate favorite entries', () => {
  const storage = memoryStorage();
  for (const value of [
    '{',
    'null',
    'x'.repeat(2000001),
    JSON.stringify(Array.from({ length: 5001 }, () => ({}))),
  ]) {
    storage.setItem(FAVORITES_KEY, value);
    expect(readFavorites(storage)).toEqual([]);
  }
  storage.setItem(
    FAVORITES_KEY,
    JSON.stringify([
      { id: 'x', type: 'expo', favoritedAt: 1 },
      { id: 'x', type: 'expo', favoritedAt: 2 },
      null,
    ]),
  );
  expect(readFavorites(storage)).toHaveLength(1);
});

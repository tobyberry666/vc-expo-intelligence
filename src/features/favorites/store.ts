import { z } from 'zod';
import { scopedStorage } from '@/infrastructure/runtime';
import { readFeedCache } from '../feed/cache';
import type { StoragePort } from '../feed/cache';

export const FAVORITES_KEY = '__global_vc_expo_favorites';
const favoriteSchema = z.object({
  id: z.string().min(1).max(16000),
  type: z.enum(['investment', 'expo']),
  favoritedAt: z.number().int().nonnegative(),
});
export type IFavoriteItem = z.infer<typeof favoriteSchema>;
export function readFavorites(storage: StoragePort): IFavoriteItem[] {
  try {
    const raw = storage.getItem(FAVORITES_KEY);
    if (!raw || raw.length > 2000000) return [];
    const values: unknown = JSON.parse(raw);
    if (!Array.isArray(values) || values.length > 5000) return [];
    const aliases = readFeedCache(storage, true)?.legacyIds ?? {};
    const items = new Map<string, IFavoriteItem>();
    let migrated = false;
    for (const value of values) {
      const parsed = favoriteSchema.safeParse(value);
      if (!parsed.success) continue;
      const item = parsed.data;
      const canonicalId = aliases[`${item.type}:${item.id}`];
      if (canonicalId && canonicalId !== item.id) {
        item.id = canonicalId;
        migrated = true;
      }
      items.set(`${item.type}:${item.id}`, item);
    }
    const result = [...items.values()];
    // Persist verified migrations before the associated event rotates out of the feed.
    if (migrated) {
      try {
        storage.setItem(FAVORITES_KEY, JSON.stringify(result));
      } catch {
        /* Keep readable session data. */
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function createFavoritesStore(storage: StoragePort = scopedStorage) {
  let snapshot = {
    favorites: readFavorites(storage),
    error: null as string | null,
  };
  let lastRaw: string | null | undefined;
  try {
    lastRaw = storage.getItem(FAVORITES_KEY);
  } catch {
    /* Storage can be blocked. */
  }
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of listeners) listener();
  };
  const sync = () => {
    try {
      const raw = storage.getItem(FAVORITES_KEY);
      if (raw === lastRaw) return;
      snapshot = { favorites: readFavorites(storage), error: null };
      lastRaw = storage.getItem(FAVORITES_KEY);
      publish();
    } catch {
      /* Preserve session favorites when persistence is unavailable. */
    }
  };
  function update(items: IFavoriteItem[]) {
    let error: string | null = null;
    try {
      const raw = JSON.stringify(items);
      storage.setItem(FAVORITES_KEY, raw);
      lastRaw = raw;
    } catch {
      error = '收藏暂存于本次会话，浏览器存储不可用';
    }
    snapshot = { favorites: items, error };
    publish();
  }
  const onStorage = () => sync();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      if (!listeners.size) {
        sync();
        window.addEventListener('storage', onStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) window.removeEventListener('storage', onStorage);
      };
    },
    toggleFavorite: (id: string, type: IFavoriteItem['type']) => {
      if (
        !favoriteSchema.safeParse({ id, type, favoritedAt: Date.now() }).success
      )
        return;
      const items = snapshot.favorites;
      const exists = items.some((f) => f.id === id && f.type === type);
      update(
        exists
          ? items.filter((f) => f.id !== id || f.type !== type)
          : [...items, { id, type, favoritedAt: Date.now() }],
      );
    },
    removeFavorite: (id: string, type: IFavoriteItem['type']) =>
      update(snapshot.favorites.filter((f) => f.id !== id || f.type !== type)),
    clearAll: () => update([]),
  };
}
export const favoritesStore = createFavoritesStore();

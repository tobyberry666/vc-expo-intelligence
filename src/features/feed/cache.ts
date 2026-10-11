import { z } from 'zod';
import { scopedStorage } from '@/infrastructure/runtime';
import { investmentSchema, expoSchema } from './types';
import type { FeedData } from './types';
import { investmentId, expoId } from './identity';
import { normalizeDate } from './dates';

export const CACHE_KEY = '__live_feed_cache';
export const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_STALE_AGE = 30 * CACHE_TTL;
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
const cacheSchema = z.object({
  version: z.union([z.literal(3), z.literal(4)]),
  timestamp: z.number().int().positive(),
  fullSummary: z.string().max(1000000),
  liveInvestments: z.array(investmentSchema).max(100),
  liveExpos: z.array(expoSchema).max(50),
  legacyIds: z.record(z.string(), z.string().max(16000)).optional(),
});
export interface CacheData extends FeedData {
  timestamp: number;
  version: 4;
  legacyIds: Record<string, string>;
}

export function readFeedCache(
  storage: StoragePort = scopedStorage,
  allowStale = false,
  now = Date.now(),
): CacheData | null {
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw || raw.length > 2000000) return null;
    const result = cacheSchema.safeParse(JSON.parse(raw));
    if (!result.success) return null;
    const data = result.data;
    const age = now - data.timestamp;
    if (age < 0 || age > (allowStale ? MAX_STALE_AGE : CACHE_TTL)) return null;
    const legacyIds = { ...(data.legacyIds ?? {}) };
    const liveInvestments = data.liveInvestments.map((item) => {
      const normalized = { ...item, date: normalizeDate(item.date) };
      const id = investmentId(normalized);
      if (data.version === 3 && /^live-inv-\d+$/.test(item.id))
        legacyIds[`investment:${item.id}`] = id;
      return { ...normalized, id };
    });
    const liveExpos = data.liveExpos.map((item) => {
      const normalized = {
        ...item,
        startDate: normalizeDate(item.startDate),
        endDate: normalizeDate(item.endDate),
      };
      const id = expoId(normalized);
      if (data.version === 3 && /^live-expo-\d+$/.test(item.id))
        legacyIds[`expo:${item.id}`] = id;
      return { ...normalized, id };
    });
    const validIds = new Set(
      [...liveInvestments, ...liveExpos].map((item) => item.id),
    );
    for (const [key, id] of Object.entries(legacyIds))
      if (!validIds.has(id)) delete legacyIds[key];
    return { ...data, liveInvestments, liveExpos, version: 4, legacyIds };
  } catch {
    return null;
  }
}

export function writeFeedCache(
  data: CacheData,
  storage: StoragePort = scopedStorage,
): boolean {
  try {
    const result = cacheSchema.safeParse(data);
    if (!result.success) return false;
    const raw = JSON.stringify(result.data);
    if (raw.length > 2000000) return false;
    storage.setItem(CACHE_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

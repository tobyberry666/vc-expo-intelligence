import { readFeedCache, writeFeedCache, CACHE_TTL } from './cache';
import type { CacheData, StoragePort } from './cache';
import type { FeedPhase, LiveFeedState } from './types';
import type { FeedResult } from './service';
import { extractSection } from './parsers';
import { withDeadline } from './async';

export type FeedLoader = (
  signal: AbortSignal,
  onPhase: (phase: FeedPhase) => void,
) => Promise<FeedResult>;
export function createFeedStore(loader: FeedLoader, storage: StoragePort) {
  let cache = readFeedCache(storage, true);
  let controller: AbortController | null = null;
  let generation = 0;
  let initialized = false;
  let pending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const resolveItemId = (id: string, type: 'investment' | 'expo') =>
    cache?.legacyIds[`${type}:${id}`] ?? id;
  let snapshot: LiveFeedState = {
    fullSummary: cache?.fullSummary ?? '',
    investmentSummary: '',
    expoSummary: '',
    liveInvestments: cache?.liveInvestments ?? [],
    liveExpos: cache?.liveExpos ?? [],
    lastUpdate: cache?.timestamp ?? null,
    error: null,
    isLoading: false,
    phase: cache ? 'done' : 'idle',
    hasData: false,
    refresh: () => {
      void refresh();
    },
    resolveItemId,
  };
  function publish(patch: Partial<LiveFeedState>) {
    snapshot = { ...snapshot, ...patch };
    snapshot.hasData = Boolean(
      snapshot.fullSummary ||
      snapshot.liveInvestments.length ||
      snapshot.liveExpos.length,
    );
    snapshot.investmentSummary = extractSection(snapshot.fullSummary, [
      '投资',
      '融资',
    ]);
    snapshot.expoSummary = extractSection(snapshot.fullSummary, [
      '展会',
      '参展',
    ]);
    for (const listener of listeners) listener();
  }
  publish({});

  async function refresh(): Promise<void> {
    initialized = true;
    controller?.abort();
    const request = new AbortController();
    controller = request;
    const current = ++generation;
    publish({ isLoading: true, phase: 'searching', error: null });
    const timer = setTimeout(() => request.abort(), 180000);
    try {
      const result = await withDeadline(
        loader(request.signal, (phase) => {
          if (current === generation && !request.signal.aborted)
            publish({ phase });
        }),
        request.signal,
        180000,
      );
      if (current !== generation || request.signal.aborted) return;
      const keepInvestments =
        !result.liveInvestments.length && snapshot.liveInvestments.length > 0;
      const keepExpos =
        !result.liveExpos.length && snapshot.liveExpos.length > 0;
      cache = {
        version: 4,
        timestamp: Date.now(),
        legacyIds: cache?.legacyIds ?? {},
        fullSummary: result.fullSummary,
        liveInvestments: keepInvestments
          ? snapshot.liveInvestments
          : result.liveInvestments,
        liveExpos: keepExpos ? snapshot.liveExpos : result.liveExpos,
      };
      const saved = writeFeedCache(cache, storage);
      const warning =
        [
          result.warning,
          keepInvestments || keepExpos ? '部分条目未更新，保留上次结果' : null,
          saved ? null : '浏览器缓存不可用，数据仅保留于本次会话',
        ]
          .filter(Boolean)
          .join('；') || null;
      publish({
        ...cache,
        lastUpdate: cache.timestamp,
        error: warning,
        phase: 'done',
      });
    } catch (error) {
      if (current !== generation) return;
      if (request.signal.aborted && !listeners.size) publish({ phase: 'idle' });
      else {
        const message = String(error);
        publish({
          phase: 'done',
          error: /妙搭|独立浏览|超时/.test(message)
            ? message.replace(/^Error: /, '')
            : request.signal.aborted
              ? '实时情报请求超时，请重试'
              : '实时情报获取失败，请重试',
        });
      }
    } finally {
      clearTimeout(timer);
      if (current === generation) {
        controller = null;
        publish({ isLoading: false });
      }
    }
  }
  function ensureLoaded(): Promise<void> {
    if (initialized) return pending ?? Promise.resolve();
    initialized = true;
    if (cache && Date.now() - cache.timestamp <= CACHE_TTL)
      return Promise.resolve();
    pending = refresh();
    return pending;
  }
  return {
    getSnapshot: () => snapshot,
    getCache: (): CacheData | null => cache,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        // StrictMode immediately resubscribes. Cancel only when truly unused.
        queueMicrotask(() => {
          if (!listeners.size && controller) {
            initialized = false;
            controller.abort();
          }
        });
      };
    },
    ensureLoaded,
    refresh,
  };
}

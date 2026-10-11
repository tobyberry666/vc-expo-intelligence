import { useEffect, useSyncExternalStore } from 'react';
import {
  capabilityClient,
  scopedStorage,
  publicFeed,
} from '@/infrastructure/runtime';
import { fetchPublicFeed } from '@/features/feed/public-feed';
import { createMiaodaProvider } from '@/features/feed/provider';
import { createFeedStore } from '@/features/feed/store';
import { fetchFeed } from '@/features/feed/service';
export type {
  LiveInvestmentItem,
  LiveExpoItem,
  LiveFeedState,
  FeedPhase,
} from '@/features/feed/types';
export { readFeedCache as loadLiveFeedCache } from '@/features/feed/cache';

const provider = createMiaodaProvider(capabilityClient);
const feedStore = createFeedStore(
  (signal, onPhase) =>
    publicFeed ? fetchPublicFeed(signal) : fetchFeed(provider, signal, onPhase),
  scopedStorage,
  publicFeed ? 0 : undefined,
);

export function useLiveFeed() {
  const state = useSyncExternalStore(
    feedStore.subscribe,
    feedStore.getSnapshot,
  );
  useEffect(() => {
    void feedStore.ensureLoaded();
  }, []);
  return state;
}

export interface FeedProvider {
  search(query: string, signal: AbortSignal): Promise<string>;
  extractInvestments(text: string, signal: AbortSignal): Promise<unknown>;
  extractExpo(text: string, signal: AbortSignal): Promise<unknown>;
}

import { throwIfAborted, withDeadline } from './async';

interface CapabilityPort {
  load(id: string): {
    callStream(
      action: string,
      params: Record<string, unknown>,
    ): AsyncIterable<unknown>;
    call(action: string, params: Record<string, unknown>): Promise<unknown>;
  };
}
export function createMiaodaProvider(client: CapabilityPort): FeedProvider {
  async function extract(id: string, text: string, signal: AbortSignal) {
    throwIfAborted(signal);
    if (text.length > 200000) throw new Error('情报文本过大');
    return withDeadline(
      client.load(id).call('textToJson', { search_result_text: text }),
      signal,
      30000,
    );
  }
  return {
    search: async (query, signal) => {
      throwIfAborted(signal);
      const stream = client
        .load('pe_vc_investment_tech_exhibition_search_1')
        .callStream('searchSummary', { additional_keywords: query });
      const iterator = stream[Symbol.asyncIterator]();
      const deadline = Date.now() + 45000;
      let text = '';
      let chunks = 0;
      try {
        while (true) {
          throwIfAborted(signal);
          if (Date.now() >= deadline) throw new Error('情报检索超时');
          if (++chunks > 10000) throw new Error('情报响应分片过多');
          const chunk = await withDeadline(
            iterator.next(),
            signal,
            Math.max(1, deadline - Date.now()),
          );
          throwIfAborted(signal);
          if (Date.now() >= deadline) throw new Error('情报检索超时');
          if (chunk.done) break;
          if (
            chunk.value &&
            typeof chunk.value === 'object' &&
            'summary' in chunk.value &&
            typeof chunk.value.summary === 'string'
          )
            text += chunk.value.summary;
          if (text.length > 200000) throw new Error('情报文本过大');
        }
        return text;
      } finally {
        // SDK has no transport AbortSignal. Close iterator best effort without hanging cleanup.
        try {
          if (iterator.return)
            void Promise.resolve(iterator.return()).catch(() => undefined);
        } catch {
          /* Best-effort cleanup must not replace the search outcome. */
        }
      }
    },
    extractInvestments: (text, signal) =>
      extract('investment_exhibition_info_extract_1', text, signal),
    extractExpo: (text, signal) =>
      extract('exhibition_level_info_extract_1', text, signal),
  };
}

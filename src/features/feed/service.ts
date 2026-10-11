import type { FeedProvider } from './provider';
import type { FeedData, FeedPhase } from './types';
import { buildSearchQueries } from './queries';
import { runConcurrent, throwIfAborted, wait } from './async';
import {
  parseExtractedInvestments,
  parseMarkdownInvestments,
  parseInvestmentsFallback,
  parseExtractedExpo,
  parseExposFallback,
  mergeInvestments,
  mergeExpos,
  attachMarkdownExhibitors,
} from './parsers';
export interface FeedResult extends FeedData {
  warning: string | null;
}
export async function fetchFeed(
  provider: FeedProvider,
  signal: AbortSignal,
  onPhase: (phase: FeedPhase) => void,
): Promise<FeedResult> {
  throwIfAborted(signal);
  onPhase('searching');
  const queries = buildSearchQueries();
  let failures = 0;
  let platformUnavailable = false;
  async function search(query: string): Promise<string> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await provider.search(query, signal);
        if (!result.trim()) {
          failures++;
          return '';
        }
        return result;
      } catch (error) {
        throwIfAborted(signal);
        const message = String(error);
        if (/PLATFORM_UNAVAILABLE/.test(message)) platformUnavailable = true;
        if (/RateLimit|频繁|429/.test(message) && attempt < 2) {
          await wait(
            3000 * 2 ** attempt + Math.floor(Math.random() * 500),
            signal,
          );
          continue;
        }
        failures++;
        return '';
      }
    }
    return '';
  }
  const results = await runConcurrent(
    [...queries.investments, ...queries.expos].map(
      (query) => () => search(query),
    ),
    3,
    signal,
  );
  const investText = results
    .slice(0, queries.investments.length)
    .filter(Boolean)
    .join('\n\n');
  const expoTexts = results.slice(queries.investments.length).filter(Boolean);
  const expoText = expoTexts.join('\n\n');
  if (!investText && !expoText)
    throw new Error(
      platformUnavailable
        ? '当前为独立浏览模式；实时情报需在妙搭平台运行'
        : '实时情报获取失败，请重试',
    );
  if (investText.length + expoText.length > 1000000)
    throw new Error('情报文本过大，请缩小检索范围');
  onPhase('extracting');
  async function extract(operation: () => Promise<unknown>): Promise<unknown> {
    try {
      return await operation();
    } catch {
      throwIfAborted(signal);
      failures++;
      return null;
    }
  }
  // Batch search outputs; avoid multiplying extraction cost for small responses.
  const structuredInvestments = [];
  const batches: string[] = [];
  for (const text of results
    .slice(0, queries.investments.length)
    .filter(Boolean)) {
    const last = batches.length - 1;
    if (last >= 0 && batches[last].length + text.length + 2 <= 200000)
      batches[last] += `\n\n${text}`;
    else batches.push(text);
  }
  for (const text of batches) {
    structuredInvestments.push(
      ...parseExtractedInvestments(
        await extract(() => provider.extractInvestments(text, signal)),
      ),
    );
  }
  const structuredExpos = [];
  for (const text of expoTexts) {
    const item = parseExtractedExpo(
      await extract(() => provider.extractExpo(text, signal)),
    );
    if (item) structuredExpos.push(item);
  }
  throwIfAborted(signal);
  const liveInvestments = mergeInvestments(
    structuredInvestments,
    parseMarkdownInvestments(investText),
    parseInvestmentsFallback(investText),
  );
  const liveExpos = attachMarkdownExhibitors(
    mergeExpos(structuredExpos, parseExposFallback(expoText)),
    expoText,
  );
  return {
    fullSummary: `## 投资情报\n${investText}\n\n## 展会情报\n${expoText}`,
    liveInvestments,
    liveExpos,
    warning: failures
      ? '部分情报源不可用，当前结果可能不完整，请核验后使用'
      : !liveInvestments.length && !liveExpos.length
        ? '未能提取结构化条目，请核验摘要或重试'
        : null,
  };
}

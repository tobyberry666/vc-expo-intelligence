import { expect, it, vi } from 'vitest';
import { createMiaodaProvider } from '../src/features/feed/provider';
import { fetchFeed } from '../src/features/feed/service';
import type { FeedProvider } from '../src/features/feed/provider';

it('stops waiting for an SDK stream that never responds', async () => {
  vi.useFakeTimers();
  try {
    const provider = createMiaodaProvider({
      load: () => ({
        callStream: () => ({
          [Symbol.asyncIterator]: () => ({ next: () => new Promise(() => {}) }),
        }),
        call: vi.fn(),
      }),
    });
    const pending = provider.search('hang', signal());
    const outcome = pending.then(
      () => null,
      (error: Error) => error,
    );
    await vi.advanceTimersByTimeAsync(45000);
    expect((await outcome)?.message).toContain('超时');
  } finally {
    vi.useRealTimers();
  }
});
it('rejects an already aborted request', async () => {
  const controller = new AbortController();
  controller.abort();
  const provider = createMiaodaProvider({ load: vi.fn() });
  await expect(
    provider.search('abort', controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' });
});

const signal = () => new AbortController().signal;
it('enforces elapsed stream deadlines even for immediately resolved empty chunks', async () => {
  let now = 0;
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
  try {
    const provider = createMiaodaProvider({
      load: () => ({
        callStream: async function* () {
          now = 50000;
          yield {};
          yield {};
        },
        call: vi.fn(),
      }),
    });
    await expect(provider.search('empty', signal())).rejects.toThrow('超时');
  } finally {
    clock.mockRestore();
  }
});
it('does not let iterator cleanup errors replace a valid search result', async () => {
  let done = false;
  const provider = createMiaodaProvider({
    load: () => ({
      callStream: () => ({
        [Symbol.asyncIterator]: () => ({
          next: async () => {
            if (done) return { done: true as const, value: undefined };
            done = true;
            return { done: false as const, value: { summary: 'valid' } };
          },
          return: () => {
            throw new Error('cleanup');
          },
        }),
      }),
      call: vi.fn(),
    }),
  });
  expect(await provider.search('test', signal())).toBe('valid');
});
it('rejects whitespace-only search output', async () => {
  await expect(
    fetchFeed(
      {
        search: async () => '   ',
        extractInvestments: async () => null,
        extractExpo: async () => null,
      },
      signal(),
      vi.fn(),
    ),
  ).rejects.toThrow('情报');
});
it('sends only declared search capability inputs', async () => {
  const callStream = vi.fn(async function* () {
    yield { summary: 'result' };
  });
  const provider = createMiaodaProvider({
    load: () => ({ callStream, call: vi.fn() }),
  });
  expect(await provider.search('AI 投资', signal())).toBe('result');
  expect(callStream).toHaveBeenCalledWith('searchSummary', {
    additional_keywords: 'AI 投资',
  });
});
it('rejects total search failure instead of caching an empty success', async () => {
  const provider: FeedProvider = {
    search: async () => {
      throw new Error('network');
    },
    extractInvestments: async () => null,
    extractExpo: async () => null,
  };
  await expect(fetchFeed(provider, signal(), vi.fn())).rejects.toThrow('情报');
});
it('retries rate limits with backoff, but reports extraction failure', async () => {
  vi.useFakeTimers();
  try {
    const attempts = new Map<string, number>();
    const provider: FeedProvider = {
      search: async (query) => {
        const count = attempts.get(query) ?? 0;
        attempts.set(query, count + 1);
        if (!count) throw new Error('429');
        return '正文';
      },
      extractInvestments: async () => {
        throw new Error('extract network');
      },
      extractExpo: async () => null,
    };
    const pending = fetchFeed(provider, signal(), vi.fn());
    await vi.advanceTimersByTimeAsync(40000);
    const result = await pending;
    expect([...attempts.values()]).toEqual(Array(15).fill(2));
    expect(result.warning).toContain('部分');
  } finally {
    vi.useRealTimers();
  }
});
it('aborts rate-limit backoff without issuing another request', async () => {
  const controller = new AbortController();
  const search = vi.fn(async () => {
    throw new Error('429');
  });
  const pending = fetchFeed(
    {
      search,
      extractInvestments: async () => null,
      extractExpo: async () => null,
    },
    controller.signal,
    vi.fn(),
  );
  const outcome = pending.catch((error: Error) => error);
  await Promise.resolve();
  await Promise.resolve();
  controller.abort();
  expect(await outcome).toMatchObject({ name: 'AbortError' });
  expect(search).toHaveBeenCalledTimes(3);
});
it('bounds stream payload size and malformed chunk count', async () => {
  const provider = createMiaodaProvider({
    load: () => ({
      callStream: async function* () {
        yield { summary: 'x'.repeat(200001) };
      },
      call: vi.fn(),
    }),
  });
  await expect(provider.search('big', signal())).rejects.toThrow('过大');
  const empty = createMiaodaProvider({
    load: () => ({
      callStream: async function* () {
        while (true) yield null;
      },
      call: vi.fn(),
    }),
  });
  await expect(empty.search('empty', signal())).rejects.toThrow('分片');
  await expect(
    provider.extractExpo('x'.repeat(200001), signal()),
  ).rejects.toThrow('过大');
});
it('parses structured data and retains the expo date range', async () => {
  const extractInvestments = vi.fn(async () => ({
    investment_events: [
      {
        invested_company: '星河科技',
        investor: 'IDG资本',
        investment_round: 'A轮',
        investment_date: '2026-07-01',
      },
    ],
  }));
  const provider: FeedProvider = {
    search: async () => 'search text',
    extractInvestments,
    extractExpo: async () => ({
      exhibition_name: 'CES 2026',
      exhibition_date: '2026-01-06至2026-01-09',
      chinese_exhibitor_names: [{ company_name: '测试科技' }],
    }),
  };
  const phases: string[] = [];
  const result = await fetchFeed(provider, signal(), (phase) =>
    phases.push(phase),
  );
  expect(result.liveInvestments).toHaveLength(1);
  expect(result.liveExpos).toHaveLength(1);
  expect(result.liveExpos[0]).toMatchObject({
    startDate: '2026-01-06',
    endDate: '2026-01-09',
    exhibitors: ['测试科技'],
  });
  expect(phases).toEqual(['searching', 'extracting']);
  expect(extractInvestments).toHaveBeenCalledTimes(1);
});

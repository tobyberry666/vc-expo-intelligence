import { StrictMode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { capabilityClient } from '@lark-apaas/client-toolkit-lite';
import { useLiveFeed } from '../src/hooks/useLiveFeed';

it('shares real hook data across consumers under StrictMode and keeps it after refresh failure', async () => {
  const search = vi.fn(async function* () {
    yield { summary: '合成检索情报' };
  });
  vi.mocked(capabilityClient.load).mockImplementation(
    () =>
      ({
        callStream: search,
        call: async () => ({
          investment_events: [
            { invested_company: '测试公司', investment_date: '2026-10' },
          ],
        }),
      }) as never,
  );
  const first = renderHook(() => useLiveFeed(), { wrapper: StrictMode });
  const second = renderHook(() => useLiveFeed(), { wrapper: StrictMode });
  await waitFor(() => expect(first.result.current.phase).toBe('done'));
  expect(search).toHaveBeenCalledTimes(15);
  expect(first.result.current.liveInvestments[0].company).toBe('测试公司');
  expect(second.result.current.liveInvestments).toBe(
    first.result.current.liveInvestments,
  );
  vi.mocked(capabilityClient.load).mockImplementation(() => {
    throw new Error('network');
  });
  act(() => first.result.current.refresh());
  await waitFor(() => expect(second.result.current.error).toContain('失败'));
  expect(second.result.current.liveInvestments[0].company).toBe('测试公司');
});

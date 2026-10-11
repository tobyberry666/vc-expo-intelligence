import { expect, it, vi } from 'vitest';
import { runConcurrent, wait, withDeadline } from '../src/features/feed/async';

it('limits concurrency and preserves input ordering', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 8 }, (_, i) => async () => {
    peak = Math.max(peak, ++active);
    await Promise.resolve();
    active--;
    return i;
  });
  expect(await runConcurrent(tasks, 3, new AbortController().signal)).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7,
  ]);
  expect(peak).toBe(3);
});
it('cancels retry delays and settles deadline errors', async () => {
  vi.useFakeTimers();
  try {
    const controller = new AbortController();
    const pending = wait(3000, controller.signal);
    const rejected = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    });
    controller.abort();
    await rejected;
    const ready = wait(100, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(100);
    await ready;
    await expect(
      withDeadline(
        Promise.reject(new Error('failed')),
        new AbortController().signal,
        1000,
      ),
    ).rejects.toThrow('failed');
    const stopped = new AbortController();
    stopped.abort();
    await expect(
      withDeadline(Promise.resolve('late'), stopped.signal, 1000),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});

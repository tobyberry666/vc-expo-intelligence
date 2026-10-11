export function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('请求已取消', 'AbortError');
}

export function withDeadline<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  ms: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('请求已取消', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
      cleanup();
      reject(new Error('情报请求超时，请重试'));
    }, ms);
    operation.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
    if (signal.aborted) onAbort();
  });
}

export async function wait(ms: number, signal: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('请求已取消', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  signal: AbortSignal,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      throwIfAborted(signal);
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, () => worker()),
  );
  return results;
}

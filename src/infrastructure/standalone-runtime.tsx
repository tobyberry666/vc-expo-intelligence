import type { PropsWithChildren } from 'react';
export const publicFeed: boolean = true;

export function AppContainer({ children }: PropsWithChildren) {
  return children;
}
export function ErrorRender({
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  return (
    <main role="alert" className="p-8">
      <h1>页面加载失败</h1>
      <button onClick={resetErrorBoundary}>重试</button>
    </main>
  );
}
// Access is deferred so a blocked localStorage getter is caught by callers.
export const scopedStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) =>
    window.localStorage.setItem(key, value),
};
export const logger = {
  info: (message: string) => console.info(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
};
export const capabilityClient = {
  load: (_id: string): never => {
    throw new Error('PLATFORM_UNAVAILABLE');
  },
};
export const resolveAppUrl = (path: string) =>
  new URL(
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`,
    window.location.origin,
  ).href;

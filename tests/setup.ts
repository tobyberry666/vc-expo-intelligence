import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('@lark-apaas/client-toolkit-lite', () => ({
  scopedStorage: window.localStorage,
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  capabilityClient: { load: vi.fn() },
}));

afterEach(() => cleanup());

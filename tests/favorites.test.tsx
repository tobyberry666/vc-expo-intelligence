import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useFavorites } from '../src/hooks/useFavorites';

beforeEach(() => localStorage.clear());
it('synchronizes independent consumers without lost updates', () => {
  const first = renderHook(() => useFavorites());
  const second = renderHook(() => useFavorites());
  act(() => first.result.current.toggleFavorite('investment-a', 'investment'));
  expect(second.result.current.isFavorited('investment-a', 'investment')).toBe(
    true,
  );
  act(() => second.result.current.toggleFavorite('expo-b', 'expo'));
  expect(first.result.current.favorites).toHaveLength(2);
});
it('ignores malformed persisted entries', () => {
  localStorage.setItem(
    '__global_vc_expo_favorites',
    '[null, {}, {"id":1,"type":"expo"}]',
  );
  const { result } = renderHook(() => useFavorites());
  expect(result.current.favorites).toEqual([]);
});

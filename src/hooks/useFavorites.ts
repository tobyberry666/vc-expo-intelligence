import { useState, useCallback, useEffect } from 'react';
import { scopedStorage } from '@lark-apaas/client-toolkit-lite';

export interface IFavoriteItem {
  /** 条目唯一标识 */
  id: string;
  /** 条目类型：投资事件 or 展会 */
  type: 'investment' | 'expo';
  /** 收藏时间戳 */
  favoritedAt: number;
}

const STORAGE_KEY = '__global_vc_expo_favorites';

function loadFavorites(): IFavoriteItem[] {
  try {
    const raw = scopedStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveFavorites(items: IFavoriteItem[]): void {
  try {
    scopedStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silent fail — storage full or unavailable
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<IFavoriteItem[]>(loadFavorites);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const isFavorited = useCallback(
    (id: string, type: IFavoriteItem['type']) =>
      favorites.some((f) => f.id === id && f.type === type),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string, type: IFavoriteItem['type']) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id && f.type === type);
        if (exists) {
          return prev.filter((f) => !(f.id === id && f.type === type));
        }
        return [...prev, { id, type, favoritedAt: Date.now() }];
      });
    },
    []
  );

  const removeFavorite = useCallback(
    (id: string, type: IFavoriteItem['type']) => {
      setFavorites((prev) => prev.filter((f) => !(f.id === id && f.type === type)));
    },
    []
  );

  const clearAll = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorited,
    toggleFavorite,
    removeFavorite,
    clearAll,
  };
}

import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { favoritesStore } from '@/features/favorites/store';
export type { IFavoriteItem } from '@/features/favorites/store';

export function useFavorites() {
  const { favorites, error } = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
  );
  return {
    favorites,
    error,
    isFavorited: (id: string, type: 'investment' | 'expo') =>
      favorites.some((f) => f.id === id && f.type === type),
    toggleFavorite: (id: string, type: 'investment' | 'expo') => {
      favoritesStore.toggleFavorite(id, type);
      const message = favoritesStore.getSnapshot().error;
      if (message) toast.warning(message);
    },
    removeFavorite: favoritesStore.removeFavorite,
    clearAll: favoritesStore.clearAll,
  };
}

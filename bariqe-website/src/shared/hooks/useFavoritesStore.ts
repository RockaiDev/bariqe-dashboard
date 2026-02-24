
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/shared/types';
import { profileService } from '@/lib/services/profile';

interface FavoritesStore {
  items: Product[];
  _isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  toggleItem: (product: Product) => void;
  clearFavorites: () => void;
  isFavorite: (id: string) => boolean;
  syncFromBackend: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      _isAuthenticated: false,

      setAuthenticated: (value) => {
        set({ _isAuthenticated: value });
      },

      addItem: (product) => {
        const items = get().items;
        if (!items.find((item) => item._id === product._id)) {
          set({ items: [...items, product] });
        }

        // Persist to backend if authenticated
        if (get()._isAuthenticated) {
          profileService.addFavorite(String(product._id)).catch(() => { });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item._id !== id) });

        // Persist to backend if authenticated
        if (get()._isAuthenticated) {
          profileService.removeFavorite(id).catch(() => { });
        }
      },

      toggleItem: (product) => {
        const items = get().items;
        const exists = items.some((item) => item._id === product._id);

        if (exists) {
          set({ items: items.filter((item) => item._id !== product._id) });

          // Persist removal to backend
          if (get()._isAuthenticated) {
            profileService.removeFavorite(String(product._id)).catch(() => { });
          }
        } else {
          set({ items: [...items, product] });

          // Persist addition to backend
          if (get()._isAuthenticated) {
            profileService.addFavorite(String(product._id)).catch(() => { });
          }
        }
      },

      clearFavorites: () => {
        set({ items: [] });
      },

      isFavorite: (id) => {
        return get().items.some((item) => item._id === id);
      },

      // Sync favorites from backend into the local store
      syncFromBackend: async () => {
        try {
          const backendFavorites = await profileService.getFavorites();

          // Mark as authenticated since the API call succeeded
          set({ _isAuthenticated: true });

          if (Array.isArray(backendFavorites) && backendFavorites.length > 0) {
            const localItems = get().items;

            // Merge: keep backend items + any local items not yet on backend
            const backendIds = new Set(backendFavorites.map((f) => String(f._id)));
            const localOnly = localItems.filter((item) => !backendIds.has(String(item._id)));

            // Push local-only items to backend
            for (const item of localOnly) {
              profileService.addFavorite(String(item._id)).catch(() => { });
            }

            // Set merged list as the source of truth
            set({ items: [...backendFavorites, ...localOnly] });
          } else {
            // Backend has no favorites - push all local items to backend
            const localItems = get().items;
            for (const item of localItems) {
              profileService.addFavorite(String(item._id)).catch(() => { });
            }
          }
        } catch {
          // If backend fails (401 etc), user is not authenticated
          set({ _isAuthenticated: false });
        }
      },
    }),
    {
      name: 'favorites-storage',
      partialize: (state) => ({ items: state.items, _isAuthenticated: state._isAuthenticated }),
    }
  )
);


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/shared/types';

interface FavoritesStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  toggleItem: (product: Product) => void;
  clearFavorites: () => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        const items = get().items;
        if (!items.find((item) => item._id === product._id)) {
          set({ items: [...items, product] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item._id !== id) });
      },

      toggleItem: (product) => {
        const items = get().items;
        const exists = items.some((item) => item._id === product._id);
        
        if (exists) {
          set({ items: items.filter((item) => item._id !== product._id) });
        } else {
          set({ items: [...items, product] });
        }
      },

      clearFavorites: () => {
        set({ items: [] });
      },
      
      isFavorite: (id) => {
        return get().items.some((item) => item._id === id);
      }
    }),
    {
      name: 'favorites-storage',
    }
  )
);


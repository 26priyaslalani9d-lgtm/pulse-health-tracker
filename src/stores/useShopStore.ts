import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

interface ShopState {
  wishlist: string[];
  toggleWishlist: (id: string) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      wishlist: [],
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((w) => w !== id)
            : [...s.wishlist, id],
        })),
    }),
    { name: 'pulse-shop', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

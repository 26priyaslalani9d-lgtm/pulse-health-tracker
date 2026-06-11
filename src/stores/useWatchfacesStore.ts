import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

interface WatchfacesState {
  favorites: string[];
  /** face applied as the Standby Clock */
  appliedFaceId: string | null;
  toggleFavorite: (id: string) => void;
  applyFace: (id: string) => void;
}

export const useWatchfacesStore = create<WatchfacesState>()(
  persist(
    (set) => ({
      favorites: [],
      appliedFaceId: null,
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      applyFace: (id) => set({ appliedFaceId: id }),
    }),
    { name: 'pulse-watchfaces', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

/**
 * iOS has no stress API — Pulse is honest about that: stress is a manual
 * 0-100 check-in with local history (stated in the UI).
 */
export interface StressEntry {
  /** ISO datetime */
  at: string;
  /** 0-100 */
  level: number;
  note?: string;
}

interface StressState {
  entries: StressEntry[];
  addEntry: (level: number, note?: string) => void;
}

export const useStressStore = create<StressState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (level, note) =>
        set((s) => ({
          entries: [{ at: new Date().toISOString(), level, note }, ...s.entries].slice(0, 500),
        })),
    }),
    { name: 'pulse-stress', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

export function stressLabel(level: number): string {
  if (level < 25) return 'Relaxed';
  if (level < 50) return 'Mild';
  if (level < 75) return 'Elevated';
  return 'High';
}

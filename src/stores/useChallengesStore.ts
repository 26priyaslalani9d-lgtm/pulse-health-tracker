import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

export interface JoinedChallenge {
  id: string;
  joinedAt: string;
  /** metric accumulated inside the challenge window so far */
  progress: number;
  completed: boolean;
  notifiedCompletion: boolean;
}

interface ChallengesState {
  joined: Record<string, JoinedChallenge>;
  earnedBadges: string[];
  join: (id: string) => void;
  leave: (id: string) => void;
  setProgress: (id: string, progress: number, target: number) => void;
  markNotified: (id: string) => void;
}

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set) => ({
      joined: {},
      earnedBadges: [],
      join: (id) =>
        set((s) => ({
          joined: {
            ...s.joined,
            [id]: {
              id,
              joinedAt: new Date().toISOString(),
              progress: 0,
              completed: false,
              notifiedCompletion: false,
            },
          },
        })),
      leave: (id) =>
        set((s) => {
          const next = { ...s.joined };
          delete next[id];
          return { joined: next };
        }),
      setProgress: (id, progress, target) =>
        set((s) => {
          const entry = s.joined[id];
          if (!entry) return s;
          const completed = progress >= target;
          return {
            joined: { ...s.joined, [id]: { ...entry, progress, completed } },
            earnedBadges:
              completed && !s.earnedBadges.includes(id)
                ? [...s.earnedBadges, id]
                : s.earnedBadges,
          };
        }),
      markNotified: (id) =>
        set((s) => {
          const entry = s.joined[id];
          if (!entry) return s;
          return { joined: { ...s.joined, [id]: { ...entry, notifiedCompletion: true } } };
        }),
    }),
    { name: 'pulse-challenges', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

interface GoalsState {
  steps: number;
  /** km */
  distanceKm: number;
  /** kcal active energy */
  calories: number;
  /** hours */
  sleepHours: number;
  /** streak target length shown on the streak card */
  streakTargetDays: number;
  setGoal: (goal: Partial<Pick<GoalsState, 'steps' | 'distanceKm' | 'calories' | 'sleepHours' | 'streakTargetDays'>>) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      steps: 10000,
      distanceKm: 8,
      calories: 400,
      sleepHours: 7.5,
      streakTargetDays: 7,
      setGoal: (goal) => set(goal),
    }),
    { name: 'pulse-goals', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

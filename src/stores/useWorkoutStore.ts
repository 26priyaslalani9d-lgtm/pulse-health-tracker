import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';
import type { Workout, WorkoutType } from '@/types/health';

/** A serializable copy of Workout (Dates as ISO strings) for persistence. */
export interface StoredWorkout {
  id: string;
  type: WorkoutType;
  start: string;
  end: string;
  durationMin: number;
  calories: number;
  distanceKm?: number;
  steps?: number;
  /** sparse HR curve captured during recording */
  hrCurve?: { t: string; bpm: number }[];
}

export function toWorkout(s: StoredWorkout): Workout {
  const base = {
    id: s.id,
    start: new Date(s.start),
    end: new Date(s.end),
    durationMin: s.durationMin,
    calories: s.calories,
    source: 'pulse' as const,
  };
  if (s.type === 'strength' || s.type === 'yoga' || s.type === 'other') {
    return { ...base, type: s.type };
  }
  return { ...base, type: s.type, distanceKm: s.distanceKm ?? 0, steps: s.steps };
}

interface WorkoutState {
  recorded: StoredWorkout[];
  addRecorded: (w: StoredWorkout) => void;
  clear: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      recorded: [],
      addRecorded: (w) => set((s) => ({ recorded: [w, ...s.recorded].slice(0, 200) })),
      clear: () => set({ recorded: [] }),
    }),
    { name: 'pulse-workouts', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** Merge platform workouts with in-app recordings, de-duped by closeness in time. */
export function mergeWorkouts(platform: Workout[], recorded: StoredWorkout[]): Workout[] {
  const fromStore = recorded.map(toWorkout);
  const merged: Workout[] = [...platform];
  for (const local of fromStore) {
    const dupe = platform.some(
      (p) =>
        p.type === local.type &&
        Math.abs(p.start.getTime() - local.start.getTime()) < 90_000,
    );
    if (!dupe) merged.push(local);
  }
  return merged.sort((a, b) => b.start.getTime() - a.start.getTime());
}

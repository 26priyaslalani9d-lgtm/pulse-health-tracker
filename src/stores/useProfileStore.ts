import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

export type Units = 'metric' | 'imperial';
export type Sex = 'female' | 'male' | 'other' | '';

interface ProfileState {
  onboarded: boolean;
  name: string;
  dob: string; // ISO date or ''
  sex: Sex;
  /** cm */
  height: number;
  /** kg */
  weight: number;
  units: Units;
  gold: boolean;
  setProfile: (p: Partial<Omit<ProfileState, 'setProfile' | 'completeOnboarding'>>) => void;
  completeOnboarding: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      onboarded: false,
      name: '',
      dob: '',
      sex: '',
      height: 170,
      weight: 70,
      units: 'metric',
      gold: false,
      setProfile: (p) => set(p),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: 'pulse-profile', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** Stride length estimate from height — used only when the OS gives no distance. */
export function strideMetersFor(heightCm: number): number {
  return (heightCm * 0.414) / 100;
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';
import type { MockProfile } from '@/services/health';

interface NotificationPrefs {
  goalReached: boolean;
  streakAtRisk: boolean;
  challenges: boolean;
}

interface DevSettings {
  forceMock: boolean;
  mockProfile: MockProfile;
  timeSkipDays: number;
  goldOverride: boolean | null;
}

interface SettingsState {
  notifications: NotificationPrefs;
  dev: DevSettings;
  setNotificationPref: (pref: Partial<NotificationPrefs>) => void;
  setDev: (dev: Partial<DevSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: { goalReached: true, streakAtRisk: true, challenges: true },
      dev: { forceMock: false, mockProfile: 'active', timeSkipDays: 0, goldOverride: null },
      setNotificationPref: (pref) =>
        set((s) => ({ notifications: { ...s.notifications, ...pref } })),
      setDev: (dev) => set((s) => ({ dev: { ...s.dev, ...dev } })),
    }),
    { name: 'pulse-settings', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

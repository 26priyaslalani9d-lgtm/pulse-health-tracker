import { create } from 'zustand';

import { mmkv } from './storage';
import type { DataSource } from '@/services/health';
import type {
  DailyMetrics,
  HourlySteps,
  PermissionState,
  TodaySnapshot,
  Workout,
} from '@/types/health';

const LAST_SYNCED_KEY = 'pulse-last-synced';

interface HealthState {
  permission: PermissionState;
  source: DataSource;
  syncing: boolean;
  /** ms epoch of last successful sync, null = never */
  lastSynced: number | null;
  today: TodaySnapshot | null;
  /** pedometer steps observed since the live subscription started */
  liveStepDelta: number;
  /** rolling 90-day daily aggregates, oldest first */
  history: DailyMetrics[];
  hourlyToday: HourlySteps[];
  recentWorkouts: Workout[];

  setPermission: (p: PermissionState) => void;
  setSource: (s: DataSource) => void;
  setSyncing: (b: boolean) => void;
  markSynced: () => void;
  setToday: (t: TodaySnapshot) => void;
  setLiveStepDelta: (n: number) => void;
  setHistory: (h: DailyMetrics[]) => void;
  setHourlyToday: (h: HourlySteps[]) => void;
  setRecentWorkouts: (w: Workout[]) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  permission: 'undetermined',
  source: 'mock',
  syncing: false,
  lastSynced: mmkv.getNumber(LAST_SYNCED_KEY) ?? null,
  today: null,
  liveStepDelta: 0,
  history: [],
  hourlyToday: [],
  recentWorkouts: [],

  setPermission: (permission) => set({ permission }),
  setSource: (source) => set({ source }),
  setSyncing: (syncing) => set({ syncing }),
  markSynced: () => {
    const now = Date.now();
    mmkv.set(LAST_SYNCED_KEY, now);
    set({ lastSynced: now, liveStepDelta: 0 });
  },
  setToday: (today) => set({ today }),
  setLiveStepDelta: (liveStepDelta) => set({ liveStepDelta }),
  setHistory: (history) => set({ history }),
  setHourlyToday: (hourlyToday) => set({ hourlyToday }),
  setRecentWorkouts: (recentWorkouts) => set({ recentWorkouts }),
}));

/** Today's displayed step total = last platform total + live pedometer delta. */
export function selectDisplayedSteps(s: Pick<HealthState, 'today' | 'liveStepDelta'>): number {
  return (s.today?.steps ?? 0) + s.liveStepDelta;
}

/**
 * Mock data engine — used automatically on the iOS Simulator or when health
 * permissions are denied/unavailable. Always paired with the visible
 * "demo data" badge in the UI; never silently impersonates real data.
 */

import { Platform } from 'react-native';

import { addDays, dayKey, endOfDay, fromDayKey, lastNDayKeys, startOfDay } from '@/lib/dates';
import type {
  DailyMetrics,
  DateRange,
  HealthService,
  HeartRateSample,
  HourlySteps,
  OxygenSample,
  SleepSession,
  SleepStageInterval,
  TodaySnapshot,
  Workout,
  WorkoutDraft,
} from '@/types/health';

export type MockProfile = 'sedentary' | 'active' | 'athlete';

interface MockConfig {
  profile: MockProfile;
  seed: number;
  /** dev-panel time travel for streak testing */
  timeSkipDays: number;
}

const config: MockConfig = { profile: 'active', seed: 42, timeSkipDays: 0 };

export function configureMock(partial: Partial<MockConfig>): void {
  Object.assign(config, partial);
}

export function getMockConfig(): Readonly<MockConfig> {
  return config;
}

/** Deterministic PRNG (mulberry32) so demo data is stable across renders. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedForDay(key: string): number {
  let h = config.seed;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

const PROFILE_BASE: Record<MockProfile, { steps: number; spread: number }> = {
  sedentary: { steps: 3500, spread: 2500 },
  active: { steps: 9000, spread: 5000 },
  athlete: { steps: 14000, spread: 6000 },
};

function now(): Date {
  return addDays(new Date(), config.timeSkipDays);
}

/** Hourly weights peaking ~8am / 1pm / 7pm per the brief. */
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0.5, 1.5, 4, 9, 6, 4, 5, 8, 9, 5, 4, 5, 7, 10, 8, 4, 2, 1, 0.5,
];
const WEIGHT_SUM = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);

function dailyStepsFor(key: string): number {
  const r = rng(seedForDay(key));
  const base = PROFILE_BASE[config.profile];
  return Math.round(base.steps + (r() - 0.35) * base.spread);
}

function hourlyStepsFor(key: string): number[] {
  const total = dailyStepsFor(key);
  const r = rng(seedForDay(key) ^ 0x9e3779b9);
  return HOUR_WEIGHTS.map((w) => Math.round((total * w * (0.7 + r() * 0.6)) / WEIGHT_SUM));
}

function metricsFor(key: string, upToHour = 24): DailyMetrics {
  const hours = hourlyStepsFor(key);
  const steps = hours.slice(0, upToHour).reduce((a, b) => a + b, 0);
  return {
    date: key,
    steps,
    distanceKm: (steps * 0.74) / 1000,
    calories: Math.round(steps * 0.04),
  };
}

function isToday(key: string): boolean {
  return key === dayKey(now());
}

function metricsForClamped(key: string): DailyMetrics {
  // Today's mock numbers grow over the day like real data would.
  return isToday(key) ? metricsFor(key, now().getHours() + 1) : metricsFor(key);
}

function sleepFor(key: string): SleepSession {
  const r = rng(seedForDay(key) ^ 0x51ed270b);
  const night = fromDayKey(key);
  const bedtime = new Date(night);
  bedtime.setHours(22, 30 + Math.round(r() * 90), 0, 0);
  bedtime.setDate(bedtime.getDate() - 1);

  const stages: SleepStageInterval[] = [];
  let cursor = new Date(bedtime);
  const cycleStages = ['light', 'deep', 'light', 'rem'] as const;
  const cycles = 4 + Math.round(r());
  for (let c = 0; c < cycles; c += 1) {
    for (const stage of cycleStages) {
      const mins = 18 + r() * 35;
      const end = new Date(cursor.getTime() + mins * 60_000);
      stages.push({ stage, start: new Date(cursor), end });
      cursor = end;
    }
    if (r() > 0.6) {
      const end = new Date(cursor.getTime() + (2 + r() * 8) * 60_000);
      stages.push({ stage: 'awake', start: new Date(cursor), end });
      cursor = end;
    }
  }
  const asleepMs = stages
    .filter((s) => s.stage !== 'awake')
    .reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0);
  return {
    start: bedtime,
    end: cursor,
    asleepHours: asleepMs / 3_600_000,
    stages,
  };
}

function workoutsBetween(range: DateRange): Workout[] {
  const result: Workout[] = [];
  const horizonStart = addDays(now(), -90);
  const r = rng(config.seed ^ 0x7f4a7c15);
  // Generate a stable 90-day plan, then filter to the requested range.
  const cadence = config.profile === 'sedentary' ? 7 : config.profile === 'active' ? 3 : 1.5;
  let cursor = new Date(horizonStart);
  let i = 0;
  while (cursor < now()) {
    const gapDays = cadence * (0.6 + r() * 0.9);
    cursor = new Date(cursor.getTime() + gapDays * 24 * 3_600_000);
    if (cursor >= now()) break;
    const start = new Date(cursor);
    start.setHours(7 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
    const durationMin = 20 + Math.round(r() * 50);
    const end = new Date(start.getTime() + durationMin * 60_000);
    const pick = r();
    i += 1;
    const id = `mock-workout-${i}`;
    if (pick < 0.45) {
      result.push({
        id,
        type: pick < 0.25 ? 'walking' : 'running',
        start,
        end,
        durationMin,
        calories: Math.round(durationMin * (pick < 0.25 ? 4.5 : 9)),
        distanceKm: (durationMin / 60) * (pick < 0.25 ? 5 : 9.5),
        source: 'mock',
      });
    } else if (pick < 0.6) {
      result.push({
        id,
        type: 'cycling',
        start,
        end,
        durationMin,
        calories: Math.round(durationMin * 7),
        distanceKm: (durationMin / 60) * 22,
        source: 'mock',
      });
    } else {
      result.push({
        id,
        type: pick < 0.8 ? 'strength' : 'yoga',
        start,
        end,
        durationMin,
        calories: Math.round(durationMin * (pick < 0.8 ? 6 : 3)),
        source: 'mock',
      });
    }
  }
  return result.filter((w) => w.start >= range.start && w.start <= range.end);
}

/** Workouts recorded in-app while in demo mode live only in memory. */
const savedWorkouts: Workout[] = [];

function hrSamplesBetween(range: DateRange): HeartRateSample[] {
  const samples: HeartRateSample[] = [];
  const stepMs = 10 * 60_000;
  for (let t = range.start.getTime(); t <= range.end.getTime(); t += stepMs) {
    const date = new Date(t);
    const hour = date.getHours();
    const r = rng((seedForDay(dayKey(date)) ^ (hour * 2654435761)) >>> 0);
    const asleep = hour < 7 || hour >= 23;
    const active = HOUR_WEIGHTS[hour]! >= 8;
    const base = asleep ? 52 : active ? 95 : 68;
    const jitter = asleep ? 6 : active ? 60 : 18;
    samples.push({ bpm: Math.round(base + r() * jitter), date });
  }
  return samples;
}

export const mockHealthService: HealthService = {
  async isAvailable() {
    return true;
  },
  async requestPermissions() {
    return 'granted';
  },
  async getPermissionState() {
    return 'granted';
  },

  async getTodaySnapshot(): Promise<TodaySnapshot> {
    const today = metricsForClamped(dayKey(now()));
    const hr = hrSamplesBetween({ start: startOfDay(now()), end: now() });
    const latest = hr[hr.length - 1] ?? null;
    const avg = hr.length ? hr.reduce((s, x) => s + x.bpm, 0) / hr.length : null;
    return {
      steps: today.steps,
      distanceKm: today.distanceKm,
      calories: today.calories,
      latestHeartRate: latest,
      averageHeartRate: avg,
      latestOxygen: { percentage: 96 + Math.round(rng(seedForDay(today.date))() * 3), date: now() },
      lastNightSleep: sleepFor(today.date),
    };
  },

  async getDailyMetrics(range: DateRange): Promise<DailyMetrics[]> {
    const days = Math.ceil(
      (endOfDay(range.end).getTime() - startOfDay(range.start).getTime()) / (24 * 3_600_000),
    );
    const keys = lastNDayKeys(days, range.end);
    return keys
      .filter((k) => fromDayKey(k) >= startOfDay(range.start))
      .map((k) => metricsForClamped(k));
  },

  async getHourlySteps(range: DateRange): Promise<HourlySteps[]> {
    const out: HourlySteps[] = [];
    let cursor = startOfDay(range.start);
    while (cursor <= range.end) {
      const key = dayKey(cursor);
      const hours = hourlyStepsFor(key);
      const lastHour = isToday(key) ? now().getHours() : 23;
      hours.slice(0, lastHour + 1).forEach((steps, hour) => {
        out.push({ date: key, hour, steps });
      });
      cursor = addDays(cursor, 1);
    }
    return out;
  },

  async getHeartRateSamples(range: DateRange): Promise<HeartRateSample[]> {
    return hrSamplesBetween(range);
  },

  async getOxygenSamples(range: DateRange): Promise<OxygenSample[]> {
    const out: OxygenSample[] = [];
    let cursor = new Date(range.start);
    while (cursor <= range.end) {
      const r = rng(seedForDay(dayKey(cursor)) ^ 0xabcdef);
      out.push({ percentage: 95 + Math.round(r() * 4), date: new Date(cursor) });
      cursor = new Date(cursor.getTime() + 4 * 3_600_000);
    }
    return out;
  },

  async getSleepSessions(range: DateRange): Promise<SleepSession[]> {
    const sessions: SleepSession[] = [];
    let cursor = startOfDay(range.start);
    while (cursor <= range.end) {
      sessions.push(sleepFor(dayKey(cursor)));
      cursor = addDays(cursor, 1);
    }
    return sessions.filter((s) => s.end >= range.start && s.start <= range.end);
  },

  async getWorkouts(range: DateRange): Promise<Workout[]> {
    return [...workoutsBetween(range), ...savedWorkouts]
      .filter((w) => w.start >= range.start && w.start <= range.end)
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  },

  async saveWorkout(draft: WorkoutDraft): Promise<void> {
    const base = {
      id: `pulse-mock-${Date.now()}`,
      start: draft.start,
      end: draft.end,
      durationMin: (draft.end.getTime() - draft.start.getTime()) / 60_000,
      calories: draft.calories,
      source: 'mock' as const,
    };
    if (draft.type === 'strength' || draft.type === 'yoga' || draft.type === 'other') {
      savedWorkouts.push({ ...base, type: draft.type });
    } else {
      savedWorkouts.push({
        ...base,
        type: draft.type,
        distanceKm: draft.distanceKm ?? 0,
        steps: draft.steps,
      });
    }
  },

  observeTodaySteps(cb) {
    // On web the fake stroll reads as broken tracking — a browser can't count
    // real steps, so the preview keeps today's number still instead of lying.
    if (Platform.OS === 'web') return () => {};
    // Simulated stroll (iOS Simulator): a few steps every couple of seconds.
    let total = 0;
    const interval = setInterval(() => {
      total += 2 + Math.floor(Math.random() * 4);
      cb(total);
    }, 2000);
    return () => clearInterval(interval);
  },
};

export default mockHealthService;

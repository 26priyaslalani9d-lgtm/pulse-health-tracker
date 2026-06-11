/**
 * Health Connect implementation of the HealthService interface.
 * Architected in from day one per the brief; iOS remains the first-class target.
 */

import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  insertRecords,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
  ExerciseType,
} from 'react-native-health-connect';
import { Pedometer } from 'expo-sensors';

import { debug } from '@/lib/debug';
import { dayKey, startOfDay } from '@/lib/dates';
import type {
  DailyMetrics,
  DateRange,
  HealthService,
  HeartRateSample,
  HourlySteps,
  OxygenSample,
  PermissionState,
  SleepSession,
  SleepStage,
  SleepStageInterval,
  TodaySnapshot,
  Workout,
  WorkoutDraft,
  WorkoutType,
} from '@/types/health';

const READ_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'write', recordType: 'ExerciseSession' },
] as const;

let initialized = false;
async function ensureInitialized(): Promise<boolean> {
  if (!initialized) initialized = await initialize();
  return initialized;
}

function timeRange(range: DateRange) {
  return {
    operator: 'between' as const,
    startTime: range.start.toISOString(),
    endTime: range.end.toISOString(),
  };
}

// Health Connect sleep stage constants (androidx.health.connect SleepSessionRecord)
const HC_SLEEP_STAGE: Record<number, SleepStage> = {
  1: 'awake', // STAGE_TYPE_AWAKE
  2: 'asleep', // STAGE_TYPE_SLEEPING
  3: 'inBed', // STAGE_TYPE_OUT_OF_BED (closest honest mapping)
  4: 'light',
  5: 'deep',
  6: 'rem',
};

const HC_TO_PULSE_TYPE: Record<number, WorkoutType> = {
  [ExerciseType.WALKING]: 'walking',
  [ExerciseType.RUNNING]: 'running',
  [ExerciseType.BIKING]: 'cycling',
  [ExerciseType.HIKING]: 'hiking',
  [ExerciseType.STRENGTH_TRAINING]: 'strength',
  [ExerciseType.YOGA]: 'yoga',
  [ExerciseType.SWIMMING_POOL]: 'swimming',
};

const PULSE_TO_HC_TYPE: Record<WorkoutType, number> = {
  walking: ExerciseType.WALKING,
  running: ExerciseType.RUNNING,
  cycling: ExerciseType.BIKING,
  hiking: ExerciseType.HIKING,
  strength: ExerciseType.STRENGTH_TRAINING,
  yoga: ExerciseType.YOGA,
  swimming: ExerciseType.SWIMMING_POOL,
  other: ExerciseType.OTHER_WORKOUT,
};

async function readDaily(range: DateRange): Promise<Map<string, DailyMetrics>> {
  const byDay = new Map<string, DailyMetrics>();
  const ensure = (key: string): DailyMetrics => {
    let entry = byDay.get(key);
    if (!entry) {
      entry = { date: key, steps: 0, distanceKm: 0, calories: 0 };
      byDay.set(key, entry);
    }
    return entry;
  };

  const [steps, distance, calories] = await Promise.all([
    readRecords('Steps', { timeRangeFilter: timeRange(range) }),
    readRecords('Distance', { timeRangeFilter: timeRange(range) }),
    readRecords('ActiveCaloriesBurned', { timeRangeFilter: timeRange(range) }),
  ]);

  for (const r of steps.records) ensure(dayKey(new Date(r.startTime))).steps += r.count;
  for (const r of distance.records)
    ensure(dayKey(new Date(r.startTime))).distanceKm += r.distance.inKilometers;
  for (const r of calories.records)
    ensure(dayKey(new Date(r.startTime))).calories += r.energy.inKilocalories;

  return byDay;
}

export const healthService: HealthService = {
  async isAvailable() {
    try {
      const status = await getSdkStatus();
      return status === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    if (!(await ensureInitialized())) return 'unavailable';
    const granted = await requestPermission([...READ_PERMISSIONS]);
    debug('health', 'health-connect granted', granted.length);
    if (granted.length === 0) return 'denied';
    if (granted.length < READ_PERMISSIONS.length) return 'partial';
    return 'granted';
  },

  async getPermissionState(): Promise<PermissionState> {
    try {
      if (!(await ensureInitialized())) return 'unavailable';
      const granted = await getGrantedPermissions();
      if (granted.length === 0) return 'undetermined';
      if (granted.length < READ_PERMISSIONS.length) return 'partial';
      return 'granted';
    } catch {
      return 'unavailable';
    }
  },

  async getTodaySnapshot(): Promise<TodaySnapshot> {
    const now = new Date();
    const today: DateRange = { start: startOfDay(now), end: now };
    const [daily, hr, oxygen, sleep] = await Promise.all([
      readDaily(today),
      this.getHeartRateSamples(today),
      this.getOxygenSamples(today),
      this.getSleepSessions({ start: new Date(now.getTime() - 24 * 3_600_000), end: now }),
    ]);
    const metrics = daily.get(dayKey(now)) ?? {
      date: dayKey(now),
      steps: 0,
      distanceKm: 0,
      calories: 0,
    };
    const latestHr = hr[hr.length - 1];
    const avg =
      hr.length > 0 ? hr.reduce((sum, s) => sum + s.bpm, 0) / hr.length : null;
    return {
      steps: metrics.steps,
      distanceKm: metrics.distanceKm,
      calories: metrics.calories,
      latestHeartRate: latestHr ?? null,
      averageHeartRate: avg,
      latestOxygen: oxygen[oxygen.length - 1] ?? null,
      lastNightSleep: sleep[sleep.length - 1] ?? null,
    };
  },

  async getDailyMetrics(range: DateRange): Promise<DailyMetrics[]> {
    const byDay = await readDaily(range);
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  },

  async getHourlySteps(range: DateRange): Promise<HourlySteps[]> {
    const res = await readRecords('Steps', { timeRangeFilter: timeRange(range) });
    const byKey = new Map<string, HourlySteps>();
    for (const r of res.records) {
      const d = new Date(r.startTime);
      const key = `${dayKey(d)}#${d.getHours()}`;
      const entry = byKey.get(key) ?? { date: dayKey(d), hour: d.getHours(), steps: 0 };
      entry.steps += r.count;
      byKey.set(key, entry);
    }
    return [...byKey.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.hour - b.hour,
    );
  },

  async getHeartRateSamples(range: DateRange): Promise<HeartRateSample[]> {
    const res = await readRecords('HeartRate', { timeRangeFilter: timeRange(range) });
    const samples: HeartRateSample[] = [];
    for (const record of res.records) {
      for (const s of record.samples) {
        samples.push({ bpm: s.beatsPerMinute, date: new Date(s.time) });
      }
    }
    return samples.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  async getOxygenSamples(range: DateRange): Promise<OxygenSample[]> {
    const res = await readRecords('OxygenSaturation', { timeRangeFilter: timeRange(range) });
    return res.records
      .map((r) => ({ percentage: r.percentage, date: new Date(r.time) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  async getSleepSessions(range: DateRange): Promise<SleepSession[]> {
    const res = await readRecords('SleepSession', { timeRangeFilter: timeRange(range) });
    return res.records.map((r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const stages: SleepStageInterval[] = (r.stages ?? []).map((s) => ({
        stage: HC_SLEEP_STAGE[s.stage] ?? 'asleep',
        start: new Date(s.startTime),
        end: new Date(s.endTime),
      }));
      const awakeMs = stages
        .filter((s) => s.stage === 'awake' || s.stage === 'inBed')
        .reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0);
      const totalMs = end.getTime() - start.getTime();
      return {
        start,
        end,
        asleepHours: Math.max(0, totalMs - awakeMs) / 3_600_000,
        stages:
          stages.length > 0 ? stages : [{ stage: 'asleep' as const, start, end }],
      };
    });
  },

  async getWorkouts(range: DateRange): Promise<Workout[]> {
    const res = await readRecords('ExerciseSession', { timeRangeFilter: timeRange(range) });
    return res.records.map((r) => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const type = HC_TO_PULSE_TYPE[r.exerciseType] ?? 'other';
      const base = {
        id: r.metadata?.id ?? `${r.startTime}-${r.exerciseType}`,
        start,
        end,
        durationMin: (end.getTime() - start.getTime()) / 60_000,
        calories: 0, // Health Connect stores energy on separate records
        source: 'health-connect' as const,
      };
      if (type === 'strength' || type === 'yoga' || type === 'other') {
        return { ...base, type };
      }
      return { ...base, type, distanceKm: 0 };
    });
  },

  async saveWorkout(draft: WorkoutDraft): Promise<void> {
    await insertRecords([
      {
        recordType: 'ExerciseSession',
        exerciseType: PULSE_TO_HC_TYPE[draft.type],
        startTime: draft.start.toISOString(),
        endTime: draft.end.toISOString(),
        title: `Pulse ${draft.type}`,
      },
    ]);
    debug('health', 'saved workout to Health Connect', draft.type);
  },

  observeTodaySteps(cb) {
    const sub = Pedometer.watchStepCount((event) => cb(event.steps));
    return () => sub.remove();
  },
};

export default healthService;

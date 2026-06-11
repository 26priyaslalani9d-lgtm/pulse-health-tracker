/**
 * HealthKit implementation of the HealthService interface.
 * This file (plus its .android sibling and the mock) is the ONLY place
 * a health library may be imported.
 */

import {
  AuthorizationStatus,
  AuthorizationRequestStatus,
  CategoryValueSleepAnalysis,
  WorkoutActivityType,
  getRequestStatusForAuthorization,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  saveWorkoutSample,
  authorizationStatusFor,
  type UnitForIdentifier,
} from '@kingstinct/react-native-healthkit';
import { Pedometer } from 'expo-sensors';

import { debug } from '@/lib/debug';
import { dayKey, endOfDay, startOfDay } from '@/lib/dates';
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

const STEPS = 'HKQuantityTypeIdentifierStepCount' as const;
const DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning' as const;
const ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned' as const;
const HEART_RATE = 'HKQuantityTypeIdentifierHeartRate' as const;
const OXYGEN = 'HKQuantityTypeIdentifierOxygenSaturation' as const;
const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis' as const;
const WORKOUT = 'HKWorkoutTypeIdentifier' as const;

const READ_TYPES = [STEPS, DISTANCE, ENERGY, HEART_RATE, OXYGEN, SLEEP, WORKOUT] as const;

function rangeFilter(range: DateRange) {
  return { date: { startDate: range.start, endDate: range.end } };
}

type SumIdentifier = typeof STEPS | typeof DISTANCE | typeof ENERGY;

async function cumulativeSum<T extends SumIdentifier>(
  identifier: T,
  range: DateRange,
  unit: UnitForIdentifier<T>,
): Promise<number> {
  const res = await queryStatisticsForQuantity(identifier, ['cumulativeSum'], {
    filter: rangeFilter(range),
    unit,
  });
  return res.sumQuantity?.quantity ?? 0;
}

const HK_TO_PULSE_TYPE: Partial<Record<number, WorkoutType>> = {
  [WorkoutActivityType.walking]: 'walking',
  [WorkoutActivityType.running]: 'running',
  [WorkoutActivityType.cycling]: 'cycling',
  [WorkoutActivityType.hiking]: 'hiking',
  [WorkoutActivityType.traditionalStrengthTraining]: 'strength',
  [WorkoutActivityType.yoga]: 'yoga',
};

const PULSE_TO_HK_TYPE: Record<WorkoutType, WorkoutActivityType> = {
  walking: WorkoutActivityType.walking,
  running: WorkoutActivityType.running,
  cycling: WorkoutActivityType.cycling,
  hiking: WorkoutActivityType.hiking,
  strength: WorkoutActivityType.traditionalStrengthTraining,
  yoga: WorkoutActivityType.yoga,
  swimming: WorkoutActivityType.swimming,
  other: WorkoutActivityType.other,
};

function mapSleepValue(value: number): SleepStage {
  switch (value) {
    case CategoryValueSleepAnalysis.awake:
      return 'awake';
    case CategoryValueSleepAnalysis.asleepREM:
      return 'rem';
    case CategoryValueSleepAnalysis.asleepCore:
      return 'light';
    case CategoryValueSleepAnalysis.asleepDeep:
      return 'deep';
    case CategoryValueSleepAnalysis.inBed:
      return 'inBed';
    default:
      return 'asleep';
  }
}

/** Group raw sleep intervals into sessions; a gap > 1 h starts a new session. */
function groupSleepSessions(intervals: SleepStageInterval[]): SleepSession[] {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const sessions: SleepSession[] = [];
  let current: SleepStageInterval[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const start = current[0]!.start;
    const end = current.reduce(
      (latest, s) => (s.end > latest ? s.end : latest),
      current[0]!.end,
    );
    const asleepMs = current
      .filter((s) => s.stage !== 'awake' && s.stage !== 'inBed')
      .reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0);
    sessions.push({ start, end, asleepHours: asleepMs / 3_600_000, stages: current });
    current = [];
  };

  for (const interval of sorted) {
    const prev = current[current.length - 1];
    if (prev && interval.start.getTime() - prev.end.getTime() > 3_600_000) flush();
    current.push(interval);
  }
  flush();
  return sessions;
}

export const healthService: HealthService = {
  async isAvailable() {
    try {
      return await isHealthDataAvailableAsync();
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    const granted = await requestAuthorization({
      toRead: [...READ_TYPES],
      toShare: [WORKOUT, ENERGY, DISTANCE],
    });
    debug('health', 'requestAuthorization →', granted);
    return granted ? this.getPermissionState() : 'denied';
  },

  async getPermissionState(): Promise<PermissionState> {
    try {
      const status = await getRequestStatusForAuthorization({
        toRead: [...READ_TYPES],
        toShare: [WORKOUT],
      });
      if (status === AuthorizationRequestStatus.shouldRequest) return 'undetermined';
      // HealthKit hides per-type READ denial by design. We know the sheet was
      // shown; use the workout WRITE status as the best honest signal.
      const writeStatus = authorizationStatusFor(WORKOUT);
      if (writeStatus === AuthorizationStatus.sharingDenied) return 'partial';
      return 'granted';
    } catch {
      return 'unavailable';
    }
  },

  async getTodaySnapshot(): Promise<TodaySnapshot> {
    const now = new Date();
    const today: DateRange = { start: startOfDay(now), end: now };

    const [steps, distanceMeters, calories, hrSamples, hrStats, oxygenSamples, sleep] =
      await Promise.all([
        cumulativeSum(STEPS, today, 'count'),
        cumulativeSum(DISTANCE, today, 'm'),
        cumulativeSum(ENERGY, today, 'kcal'),
        queryQuantitySamples(HEART_RATE, {
          limit: 1,
          ascending: false,
          unit: 'count/min',
          filter: rangeFilter({ start: startOfDay(now), end: now }),
        }),
        queryStatisticsForQuantity(HEART_RATE, ['discreteAverage'], {
          filter: rangeFilter(today),
          unit: 'count/min',
        }),
        queryQuantitySamples(OXYGEN, {
          limit: 1,
          ascending: false,
          unit: '%',
          filter: rangeFilter(today),
        }),
        this.getSleepSessions({
          start: new Date(now.getTime() - 24 * 3_600_000),
          end: now,
        }),
      ]);

    const latestHr = hrSamples[0];
    const latestOx = oxygenSamples[0];
    return {
      steps,
      distanceKm: distanceMeters / 1000,
      calories,
      latestHeartRate: latestHr
        ? { bpm: latestHr.quantity, date: new Date(latestHr.endDate) }
        : null,
      averageHeartRate: hrStats.averageQuantity?.quantity ?? null,
      latestOxygen: latestOx
        ? { percentage: latestOx.quantity, date: new Date(latestOx.endDate) }
        : null,
      lastNightSleep: sleep[sleep.length - 1] ?? null,
    };
  },

  async getDailyMetrics(range: DateRange): Promise<DailyMetrics[]> {
    const anchor = startOfDay(range.start);
    const interval = { day: 1 };
    const query = <T extends SumIdentifier>(identifier: T, unit: UnitForIdentifier<T>) =>
      queryStatisticsCollectionForQuantity(identifier, ['cumulativeSum'], anchor, interval, {
        filter: rangeFilter(range),
        unit,
      });

    const [stepsCol, distCol, calCol] = await Promise.all([
      query(STEPS, 'count'),
      query(DISTANCE, 'm'),
      query(ENERGY, 'kcal'),
    ]);

    const byDay = new Map<string, DailyMetrics>();
    const ensure = (key: string): DailyMetrics => {
      let entry = byDay.get(key);
      if (!entry) {
        entry = { date: key, steps: 0, distanceKm: 0, calories: 0 };
        byDay.set(key, entry);
      }
      return entry;
    };

    for (const stat of stepsCol) {
      if (stat.startDate) ensure(dayKey(new Date(stat.startDate))).steps = stat.sumQuantity?.quantity ?? 0;
    }
    for (const stat of distCol) {
      if (stat.startDate)
        ensure(dayKey(new Date(stat.startDate))).distanceKm = (stat.sumQuantity?.quantity ?? 0) / 1000;
    }
    for (const stat of calCol) {
      if (stat.startDate) ensure(dayKey(new Date(stat.startDate))).calories = stat.sumQuantity?.quantity ?? 0;
    }

    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  },

  async getHourlySteps(range: DateRange): Promise<HourlySteps[]> {
    const stats = await queryStatisticsCollectionForQuantity(
      STEPS,
      ['cumulativeSum'],
      startOfDay(range.start),
      { hour: 1 },
      { filter: rangeFilter(range), unit: 'count' },
    );
    return stats
      .filter((s) => s.startDate)
      .map((s) => {
        const d = new Date(s.startDate as Date);
        return { date: dayKey(d), hour: d.getHours(), steps: s.sumQuantity?.quantity ?? 0 };
      });
  },

  async getHeartRateSamples(range: DateRange): Promise<HeartRateSample[]> {
    const samples = await queryQuantitySamples(HEART_RATE, {
      limit: -1,
      ascending: true,
      unit: 'count/min',
      filter: rangeFilter(range),
    });
    return samples.map((s) => ({ bpm: s.quantity, date: new Date(s.endDate) }));
  },

  async getOxygenSamples(range: DateRange): Promise<OxygenSample[]> {
    const samples = await queryQuantitySamples(OXYGEN, {
      limit: -1,
      ascending: true,
      unit: '%',
      filter: rangeFilter(range),
    });
    return samples.map((s) => ({ percentage: s.quantity, date: new Date(s.endDate) }));
  },

  async getSleepSessions(range: DateRange): Promise<SleepSession[]> {
    const samples = await queryCategorySamples(SLEEP, {
      limit: -1,
      filter: rangeFilter(range),
    });
    const intervals: SleepStageInterval[] = samples
      .filter((s) => s.value !== CategoryValueSleepAnalysis.inBed)
      .map((s) => ({
        stage: mapSleepValue(s.value),
        start: new Date(s.startDate),
        end: new Date(s.endDate),
      }));
    return groupSleepSessions(intervals);
  },

  async getWorkouts(range: DateRange): Promise<Workout[]> {
    const proxies = await queryWorkoutSamples({
      limit: -1,
      ascending: false,
      filter: rangeFilter(range),
    });
    return proxies.map((w) => {
      const type = HK_TO_PULSE_TYPE[w.workoutActivityType] ?? 'other';
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      const base = {
        id: w.uuid,
        start,
        end,
        durationMin: (end.getTime() - start.getTime()) / 60_000,
        calories: w.totalEnergyBurned?.quantity ?? 0,
        source: 'healthkit' as const,
      };
      if (type === 'strength' || type === 'yoga' || type === 'other') {
        return { ...base, type };
      }
      return {
        ...base,
        type,
        distanceKm: (w.totalDistance?.quantity ?? 0) / 1000,
      };
    });
  },

  async saveWorkout(draft: WorkoutDraft): Promise<void> {
    await saveWorkoutSample(
      PULSE_TO_HK_TYPE[draft.type],
      [],
      draft.start,
      draft.end,
      {
        // HealthKit base units: metres / kilocalories
        distance: draft.distanceKm !== undefined ? draft.distanceKm * 1000 : undefined,
        energyBurned: draft.calories,
      },
    );
    debug('health', 'saved workout to HealthKit', draft.type);
  },

  observeTodaySteps(cb) {
    const sub = Pedometer.watchStepCount((event) => cb(event.steps));
    return () => sub.remove();
  },
};

export default healthService;

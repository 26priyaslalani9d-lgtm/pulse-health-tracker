/** Shared health domain types. UI and services speak only these — never raw library types. */

import type { DayKey } from '@/lib/dates';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DailyMetrics {
  date: DayKey;
  steps: number;
  /** kilometres */
  distanceKm: number;
  /** active energy, kcal */
  calories: number;
}

export interface HourlySteps {
  date: DayKey;
  /** 0-23 local hour */
  hour: number;
  steps: number;
}

export interface HeartRateSample {
  /** beats per minute */
  bpm: number;
  date: Date;
}

export interface OxygenSample {
  /** 0-100 percent */
  percentage: number;
  date: Date;
}

export type SleepStage = 'awake' | 'rem' | 'light' | 'deep' | 'inBed' | 'asleep';

export interface SleepStageInterval {
  stage: SleepStage;
  start: Date;
  end: Date;
}

export interface SleepSession {
  start: Date;
  end: Date;
  /** asleep time in hours (excludes awake/inBed) */
  asleepHours: number;
  stages: SleepStageInterval[];
}

/** Discriminated union over the workout kinds Pulse understands. */
export type WorkoutType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'hiking'
  | 'strength'
  | 'yoga'
  | 'swimming'
  | 'other';

interface WorkoutBase {
  id: string;
  start: Date;
  end: Date;
  /** minutes */
  durationMin: number;
  calories: number;
  source: 'healthkit' | 'health-connect' | 'pulse' | 'mock';
}

export interface DistanceWorkout extends WorkoutBase {
  type: 'walking' | 'running' | 'cycling' | 'hiking' | 'swimming';
  distanceKm: number;
  steps?: number;
}

export interface StationaryWorkout extends WorkoutBase {
  type: 'strength' | 'yoga' | 'other';
}

export type Workout = DistanceWorkout | StationaryWorkout;

export function isDistanceWorkout(w: Workout): w is DistanceWorkout {
  return (
    w.type === 'walking' ||
    w.type === 'running' ||
    w.type === 'cycling' ||
    w.type === 'hiking' ||
    w.type === 'swimming'
  );
}

export interface WorkoutDraft {
  type: WorkoutType;
  start: Date;
  end: Date;
  calories: number;
  distanceKm?: number;
  steps?: number;
  hrSamples?: HeartRateSample[];
}

export type PermissionState =
  | 'granted'
  | 'partial'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

export interface TodaySnapshot {
  steps: number;
  distanceKm: number;
  calories: number;
  latestHeartRate: HeartRateSample | null;
  averageHeartRate: number | null;
  latestOxygen: OxygenSample | null;
  lastNightSleep: SleepSession | null;
}

export interface HealthService {
  /** True when the underlying platform store exists (HealthKit / Health Connect installed). */
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<PermissionState>;
  getPermissionState(): Promise<PermissionState>;
  getTodaySnapshot(): Promise<TodaySnapshot>;
  getDailyMetrics(range: DateRange): Promise<DailyMetrics[]>;
  getHourlySteps(range: DateRange): Promise<HourlySteps[]>;
  getHeartRateSamples(range: DateRange): Promise<HeartRateSample[]>;
  getOxygenSamples(range: DateRange): Promise<OxygenSample[]>;
  getSleepSessions(range: DateRange): Promise<SleepSession[]>;
  getWorkouts(range: DateRange): Promise<Workout[]>;
  saveWorkout(draft: WorkoutDraft): Promise<void>;
  /** Live foreground step deltas (pedometer). Returns an unsubscribe fn. */
  observeTodaySteps(cb: (deltaSinceSubscribe: number) => void): () => void;
}

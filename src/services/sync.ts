/**
 * Sync orchestration: pulls from the resolved health source into the stores
 * and the SQLite cache. The cache hydrates the UI instantly at cold start;
 * a refresh then reconciles with the platform (platform totals always win).
 */

import { debug } from '@/lib/debug';
import { addDays, dayKey, lastNDayKeys, startOfDay } from '@/lib/dates';
import { computeStreak } from '@/lib/streak';
import {
  configureMock,
  resolveHealthSource,
  type ResolvedHealthSource,
} from '@/services/health';
import {
  initDb,
  readDailyMetrics,
  readHourlySteps,
  upsertDailyMetrics,
  upsertHourlySteps,
} from '@/services/db';
import { maybeNotifyGoalReached, updateChallengeNotifications } from '@/services/notifications';
import { ALL_CHALLENGES } from '@/mocks/challenges';
import { useChallengesStore } from '@/stores/useChallengesStore';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { mergeWorkouts, useWorkoutStore } from '@/stores/useWorkoutStore';

const HISTORY_DAYS = 90;

export async function resolveCurrentSource(): Promise<ResolvedHealthSource> {
  const { dev } = useSettingsStore.getState();
  configureMock({
    profile: dev.mockProfile,
    timeSkipDays: dev.timeSkipDays,
  });
  return resolveHealthSource({ forceMock: dev.forceMock });
}

/** Instant cold-start hydration from SQLite — no network, no health queries. */
export function hydrateFromCache(): void {
  initDb();
  const since = lastNDayKeys(HISTORY_DAYS)[0] ?? dayKey(new Date());
  const daily = readDailyMetrics(since);
  const hourly = readHourlySteps(dayKey(new Date()));
  const store = useHealthStore.getState();
  if (daily.length > 0) store.setHistory(daily);
  if (hourly.length > 0) store.setHourlyToday(hourly);
  debug('sync', `hydrated ${daily.length} days from cache`);
}

interface SyncOptions {
  /** pull the full 90-day window (first run / onboarding backfill) */
  backfill?: boolean;
  onBackfillProgress?: (fraction: number) => void;
}

let syncInFlight: Promise<void> | null = null;

export function syncNow(options: SyncOptions = {}): Promise<void> {
  // Coalesce concurrent pulls (pull-to-refresh while auto-sync runs, etc.)
  if (syncInFlight) return syncInFlight;
  syncInFlight = doSync(options).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function doSync(options: SyncOptions): Promise<void> {
  const store = useHealthStore.getState();
  store.setSyncing(true);
  try {
    const resolved = await resolveCurrentSource();
    store.setSource(resolved.source);
    store.setPermission(resolved.permission);
    const { service } = resolved;
    const now = new Date();

    options.onBackfillProgress?.(0.1);

    const today = await service.getTodaySnapshot();
    store.setToday(today);
    options.onBackfillProgress?.(0.3);

    // Daily aggregates: refresh a rolling window; full window on backfill.
    const windowDays = options.backfill ? HISTORY_DAYS : 14;
    const daily = await service.getDailyMetrics({
      start: startOfDay(addDays(now, -(windowDays - 1))),
      end: now,
    });
    upsertDailyMetrics(daily);
    options.onBackfillProgress?.(0.6);

    // Hourly steps: today always; last 14 days on backfill for instant charts.
    const hourlyStart = options.backfill ? addDays(now, -14) : startOfDay(now);
    const hourly = await service.getHourlySteps({ start: hourlyStart, end: now });
    upsertHourlySteps(hourly);
    options.onBackfillProgress?.(0.8);

    const since = lastNDayKeys(HISTORY_DAYS)[0] ?? dayKey(now);
    store.setHistory(readDailyMetrics(since));
    store.setHourlyToday(readHourlySteps(dayKey(now)));

    const platformWorkouts = await service.getWorkouts({
      start: addDays(now, -30),
      end: now,
    });
    store.setRecentWorkouts(
      mergeWorkouts(platformWorkouts, useWorkoutStore.getState().recorded),
    );

    updateChallengeProgress();
    store.markSynced();
    options.onBackfillProgress?.(1);

    const goals = useGoalsStore.getState();
    await maybeNotifyGoalReached(today.steps, goals.steps);
    debug('sync', `synced (${resolved.source}); today=${today.steps} steps`);
  } finally {
    useHealthStore.getState().setSyncing(false);
  }
}

/** Recompute joined-challenge progress from real history. */
export function updateChallengeProgress(): void {
  const { history, today } = useHealthStore.getState();
  const challenges = useChallengesStore.getState();
  const byDate = new Map(history.map((d) => [d.date, d]));
  const todayKey = dayKey(new Date());

  for (const joined of Object.values(challenges.joined)) {
    const def = ALL_CHALLENGES.find((c) => c.id === joined.id);
    if (!def) continue;
    let progress = 0;
    let cursor = new Date(Math.max(def.start.getTime(), new Date(joined.joinedAt).getTime()));
    const end = new Date(Math.min(def.end.getTime(), Date.now()));
    while (cursor <= end) {
      const key = dayKey(cursor);
      const day = key === todayKey && today
        ? { steps: today.steps, distanceKm: today.distanceKm, calories: today.calories }
        : byDate.get(key);
      if (day) {
        if (def.metric === 'steps') progress += day.steps;
        else if (def.metric === 'distance') progress += day.distanceKm;
        else progress += day.calories;
      }
      cursor = addDays(cursor, 1);
    }
    challenges.setProgress(def.id, progress, def.target);
  }
  void updateChallengeNotifications();
}

/** Streak from real history (per the brief: a day counts when steps >= goal). */
export function currentStreak() {
  const { history } = useHealthStore.getState();
  const goal = useGoalsStore.getState().steps;
  return computeStreak(history, goal);
}

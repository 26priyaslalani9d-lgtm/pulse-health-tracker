/** Step-streak logic: a day counts toward the streak when steps >= the step goal. */

import type { DailyMetrics } from '@/types/health';
import { dayKey, addDays, lastNDayKeys } from '@/lib/dates';

export interface StreakInfo {
  /** consecutive goal-met days ending today or yesterday */
  current: number;
  /** longest run in the supplied history */
  longest: number;
  /** true when today already met the goal */
  todayMet: boolean;
  /** current milestone tier 0-5 (1x..5x bubbles) */
  tier: number;
  /** days needed for the next tier (0 when maxed) */
  daysToNextTier: number;
}

/** Milestone thresholds for the 1x..5x bubbles. */
export const STREAK_TIERS = [3, 7, 14, 30, 60] as const;

export function computeStreak(
  history: DailyMetrics[],
  stepGoal: number,
  now = new Date(),
): StreakInfo {
  const byDate = new Map(history.map((d) => [d.date, d.steps]));
  const todayKey = dayKey(now);
  const todayMet = (byDate.get(todayKey) ?? 0) >= stepGoal;

  // Current streak: walk backwards from today (or yesterday when today not yet met —
  // an unfinished today must not break the streak).
  let current = 0;
  let cursor = todayMet ? now : addDays(now, -1);
  while ((byDate.get(dayKey(cursor)) ?? 0) >= stepGoal) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest run across the recorded window.
  let longest = 0;
  let run = 0;
  for (const key of lastNDayKeys(Math.max(history.length, 1), now)) {
    if ((byDate.get(key) ?? 0) >= stepGoal) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (key !== todayKey) {
      // today-in-progress doesn't reset the run
      run = 0;
    }
  }

  let tier = 0;
  for (const t of STREAK_TIERS) {
    if (current >= t) tier += 1;
  }
  const nextThreshold = STREAK_TIERS[tier];
  const daysToNextTier = nextThreshold === undefined ? 0 : nextThreshold - current;

  return { current, longest, todayMet, tier, daysToNextTier };
}

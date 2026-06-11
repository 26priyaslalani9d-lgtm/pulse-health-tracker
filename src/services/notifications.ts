/**
 * Local notifications: goal reached, streak at risk (8 PM), challenge events.
 *
 * iOS honesty note (also in the README): background fetch timing is decided by
 * the OS. The 8 PM streak check is therefore a *scheduled* notification whose
 * content is computed at schedule time and corrected on next app open.
 */

import * as Notifications from 'expo-notifications';

import { debug } from '@/lib/debug';
import { dayKey } from '@/lib/dates';
import { ALL_CHALLENGES } from '@/mocks/challenges';
import { mmkv } from '@/stores/storage';
import { useChallengesStore } from '@/stores/useChallengesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

const GOAL_NOTIFIED_KEY = 'pulse-goal-notified-day';
const STREAK_NOTIFICATION_ID = 'pulse-streak-at-risk';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Fire once per day when the step goal is first reached. */
export async function maybeNotifyGoalReached(steps: number, goal: number): Promise<void> {
  if (!useSettingsStore.getState().notifications.goalReached) return;
  if (steps < goal) return;
  const today = dayKey(new Date());
  if (mmkv.getString(GOAL_NOTIFIED_KEY) === today) return;
  if (!(await ensureNotificationPermission())) return;
  mmkv.set(GOAL_NOTIFIED_KEY, today);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Goal reached',
      body: `You hit ${goal.toLocaleString()} steps today. The ring is yours.`,
    },
    trigger: null,
  });
  debug('notif', 'goal reached notification sent');
}

/**
 * (Re)schedule the daily 8 PM "streak at risk" reminder. Content reflects the
 * state at schedule time; it is corrected (re-scheduled or cancelled) on each
 * sync, which is the honest best-effort iOS allows.
 */
export async function rescheduleStreakAtRisk(
  goalMetToday: boolean,
  currentStreak: number,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID).catch(() => {});
  if (!useSettingsStore.getState().notifications.streakAtRisk) return;
  if (goalMetToday) return; // nothing at risk anymore today
  if (!(await ensureNotificationPermission())) return;

  const now = new Date();
  const eightPm = new Date(now);
  eightPm.setHours(20, 0, 0, 0);
  if (eightPm <= now) return; // past 8 PM — next sync tomorrow will schedule

  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_NOTIFICATION_ID,
    content: {
      title: 'Streak at risk',
      body:
        currentStreak > 0
          ? `Your ${currentStreak}-day streak ends at midnight. A short walk can save it.`
          : 'Your step goal is still open today. A short walk gets you moving.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: eightPm,
    },
  });
  debug('notif', 'streak-at-risk scheduled for 8 PM');
}

/** Completion + ending-soon notifications for joined challenges. */
export async function updateChallengeNotifications(): Promise<void> {
  if (!useSettingsStore.getState().notifications.challenges) return;
  const { joined, markNotified } = useChallengesStore.getState();
  for (const entry of Object.values(joined)) {
    if (entry.completed && !entry.notifiedCompletion) {
      const def = ALL_CHALLENGES.find((c) => c.id === entry.id);
      if (!def) continue;
      if (!(await ensureNotificationPermission())) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Challenge complete',
          body: `You finished "${def.title}" — badge earned.`,
        },
        trigger: null,
      });
      markNotified(entry.id);
    }
  }
}

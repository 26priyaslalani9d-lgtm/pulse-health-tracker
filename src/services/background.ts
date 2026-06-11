/**
 * Background refresh via expo-background-task. iOS decides when (and whether)
 * this actually runs — documented honestly in the README. The streak reminder
 * does not depend on it (see notifications.ts).
 */

import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { debug } from '@/lib/debug';
import { syncNow, currentStreak } from '@/services/sync';
import { rescheduleStreakAtRisk } from '@/services/notifications';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';

const TASK_NAME = 'pulse-background-refresh';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await syncNow();
    const { today } = useHealthStore.getState();
    const goal = useGoalsStore.getState().steps;
    const streak = currentStreak();
    await rescheduleStreakAtRisk((today?.steps ?? 0) >= goal, streak.current);
    debug('background', 'background refresh completed');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    debug('background', 'background refresh failed', e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundRefresh(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      debug('background', 'background tasks unavailable on this device');
      return;
    }
    await BackgroundTask.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 3, // minutes; iOS treats this as a hint only
    });
    debug('background', 'registered background refresh');
  } catch (e) {
    debug('background', 'failed to register background task', e);
  }
}

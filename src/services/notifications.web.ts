/** Web fallback: browsers don't get local scheduled notifications — all no-ops. */

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function maybeNotifyGoalReached(_steps: number, _goal: number): Promise<void> {}

export async function rescheduleStreakAtRisk(
  _goalMetToday: boolean,
  _currentStreak: number,
): Promise<void> {}

export async function updateChallengeNotifications(): Promise<void> {}

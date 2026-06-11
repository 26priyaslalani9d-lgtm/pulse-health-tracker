/** Date helpers. All "day keys" are local-timezone YYYY-MM-DD strings. */

export type DayKey = string;

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function dayKey(d: Date): DayKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Last `n` day keys ending today (inclusive), oldest first. */
export function lastNDayKeys(n: number, now = new Date()): DayKey[] {
  const keys: DayKey[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    keys.push(dayKey(addDays(now, -i)));
  }
  return keys;
}

export function relativeTime(date: Date | null, now = new Date()): string {
  if (!date) return 'never';
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'Just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export function greetingForHour(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function weekdayShort(key: DayKey): string {
  return fromDayKey(key).toLocaleDateString(undefined, { weekday: 'short' });
}

export function monthDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

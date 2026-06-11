/** Number / unit formatting helpers. */

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatKm(km: number, digits = 2): string {
  return km.toFixed(digits);
}

export function formatDistance(km: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') return `${(km * 0.621371).toFixed(2)} mi`;
  return `${km.toFixed(2)} km`;
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDurationMin(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatHoursAsHm(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function percent(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return clamp((value / goal) * 100, 0, 100);
}

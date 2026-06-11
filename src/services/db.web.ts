/**
 * Web fallback for the SQLite cache: an in-memory store. The web preview
 * always runs on demo data, so persistence between visits isn't needed.
 */

import type { DailyMetrics, HourlySteps } from '@/types/health';

const daily = new Map<string, DailyMetrics>();
const hourly = new Map<string, HourlySteps>();

export function initDb(): void {
  // nothing to open on web
}

export function upsertDailyMetrics(rows: DailyMetrics[]): void {
  for (const row of rows) daily.set(row.date, { ...row });
}

export function upsertHourlySteps(rows: HourlySteps[]): void {
  for (const row of rows) hourly.set(`${row.date}#${row.hour}`, { ...row });
}

export function readDailyMetrics(sinceDate: string): DailyMetrics[] {
  return [...daily.values()]
    .filter((r) => r.date >= sinceDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function readHourlySteps(date: string): HourlySteps[] {
  return [...hourly.values()]
    .filter((r) => r.date === date)
    .sort((a, b) => a.hour - b.hour);
}

export function wipeDb(): void {
  daily.clear();
  hourly.clear();
}

/**
 * SQLite cache for time-series aggregates so charts render instantly offline.
 * The health platform remains the source of truth; rows here are upserted on
 * every sync and read synchronously at startup.
 */

import * as SQLite from 'expo-sqlite';

import { debug } from '@/lib/debug';
import type { DailyMetrics, HourlySteps } from '@/types/health';

const db = SQLite.openDatabaseSync('pulse.db');

export function initDb(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS daily_metrics (
      date TEXT PRIMARY KEY,
      steps INTEGER NOT NULL DEFAULT 0,
      distance_km REAL NOT NULL DEFAULT 0,
      calories REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS hourly_steps (
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      steps INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (date, hour)
    );
  `);
}

export function upsertDailyMetrics(rows: DailyMetrics[]): void {
  if (rows.length === 0) return;
  db.withTransactionSync(() => {
    for (const row of rows) {
      db.runSync(
        `INSERT INTO daily_metrics (date, steps, distance_km, calories)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           steps = excluded.steps,
           distance_km = excluded.distance_km,
           calories = excluded.calories`,
        [row.date, Math.round(row.steps), row.distanceKm, row.calories],
      );
    }
  });
  debug('db', `upserted ${rows.length} daily rows`);
}

export function upsertHourlySteps(rows: HourlySteps[]): void {
  if (rows.length === 0) return;
  db.withTransactionSync(() => {
    for (const row of rows) {
      db.runSync(
        `INSERT INTO hourly_steps (date, hour, steps)
         VALUES (?, ?, ?)
         ON CONFLICT(date, hour) DO UPDATE SET steps = excluded.steps`,
        [row.date, row.hour, Math.round(row.steps)],
      );
    }
  });
}

interface DailyRow {
  date: string;
  steps: number;
  distance_km: number;
  calories: number;
}

export function readDailyMetrics(sinceDate: string): DailyMetrics[] {
  const rows = db.getAllSync<DailyRow>(
    'SELECT date, steps, distance_km, calories FROM daily_metrics WHERE date >= ? ORDER BY date ASC',
    [sinceDate],
  );
  return rows.map((r) => ({
    date: r.date,
    steps: r.steps,
    distanceKm: r.distance_km,
    calories: r.calories,
  }));
}

interface HourlyRow {
  date: string;
  hour: number;
  steps: number;
}

export function readHourlySteps(date: string): HourlySteps[] {
  const rows = db.getAllSync<HourlyRow>(
    'SELECT date, hour, steps FROM hourly_steps WHERE date = ? ORDER BY hour ASC',
    [date],
  );
  return rows.map((r) => ({ date: r.date, hour: r.hour, steps: r.steps }));
}

export function wipeDb(): void {
  db.execSync('DELETE FROM daily_metrics; DELETE FROM hourly_steps;');
}

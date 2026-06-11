/**
 * Challenge definitions are local mock data; the *progress* of joined
 * challenges is computed from real health history (see sync.ts).
 */

import { addDays, startOfDay } from '@/lib/dates';

export type ChallengeMetric = 'steps' | 'distance' | 'calories';

export interface ChallengeDef {
  id: string;
  title: string;
  metric: ChallengeMetric;
  /** total to accumulate inside the window */
  target: number;
  start: Date;
  end: Date;
  participants: number;
  topParticipant: string;
  /** accent for the hero art */
  tint: string;
  art: 'mountain' | 'city' | 'track' | 'flame' | 'wave' | 'forest';
}

const today = startOfDay(new Date());

export const ALL_CHALLENGES: ChallengeDef[] = [
  {
    id: 'step-sprint-100k',
    title: '100K Step Sprint',
    metric: 'steps',
    target: 100_000,
    start: addDays(today, -3),
    end: addDays(today, 11),
    participants: 4_439,
    topParticipant: 'Vijay',
    tint: '#34D26A',
    art: 'track',
  },
  {
    id: 'calorie-crusher',
    title: 'Calorie Crusher Week',
    metric: 'calories',
    target: 3_500,
    start: addDays(today, 3),
    end: addDays(today, 10),
    participants: 2_181,
    topParticipant: 'Maya',
    tint: '#FF4D4D',
    art: 'flame',
  },
  {
    id: 'marathon-month',
    title: 'Marathon Month',
    metric: 'distance',
    target: 42.2,
    start: addDays(today, -10),
    end: addDays(today, 20),
    participants: 7_902,
    topParticipant: 'Arun',
    tint: '#F5C518',
    art: 'mountain',
  },
  {
    id: 'city-explorer',
    title: 'City Explorer 25 km',
    metric: 'distance',
    target: 25,
    start: addDays(today, 1),
    end: addDays(today, 8),
    participants: 1_054,
    topParticipant: 'Lena',
    tint: '#5EA0EF',
    art: 'city',
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior 30K',
    metric: 'steps',
    target: 30_000,
    start: addDays(today, 5),
    end: addDays(today, 7),
    participants: 12_311,
    topParticipant: 'Chris',
    tint: '#8B5CF6',
    art: 'forest',
  },
  {
    id: 'steady-burn',
    title: 'Steady Burn 2000',
    metric: 'calories',
    target: 2_000,
    start: addDays(today, -1),
    end: addDays(today, 6),
    participants: 3_873,
    topParticipant: 'Ife',
    tint: '#FF3B7A',
    art: 'wave',
  },
];

export function challengeStatus(c: ChallengeDef, now = new Date()): 'upcoming' | 'active' | 'ended' {
  if (now < c.start) return 'upcoming';
  if (now > c.end) return 'ended';
  return 'active';
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (24 * 3_600_000)));
}

export function metricLabel(metric: ChallengeMetric): string {
  if (metric === 'steps') return 'Steps challenge';
  if (metric === 'distance') return 'Distance challenge';
  return 'Calories challenge';
}

export function formatTarget(c: ChallengeDef): string {
  if (c.metric === 'distance') return `${c.target} km`;
  if (c.metric === 'calories') return `${c.target.toLocaleString()} kcal`;
  return `${c.target.toLocaleString()} steps`;
}

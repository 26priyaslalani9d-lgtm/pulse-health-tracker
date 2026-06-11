import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoonStar } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PText } from '@/components/ui/PText';
import { Ring } from '@/components/ui/Ring';
import { Screen } from '@/components/ui/Screen';
import { Sparkline } from '@/components/ui/Sparkline';
import { colors } from '@/lib/tokens';
import { addDays } from '@/lib/dates';
import { formatHoursAsHm } from '@/lib/format';
import { resolveCurrentSource } from '@/services/sync';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';
import type { SleepSession, SleepStage } from '@/types/health';

const STAGE_COLOR: Record<SleepStage, string> = {
  awake: colors.accent.distance,
  rem: colors.accent.spo2,
  light: colors.accent.sleep,
  deep: colors.accent.streak,
  asleep: colors.accent.sleep,
  inBed: colors.text.tertiary,
};

const STAGE_LABEL: Record<SleepStage, string> = {
  awake: 'Awake',
  rem: 'REM',
  light: 'Light',
  deep: 'Deep',
  asleep: 'Asleep',
  inBed: 'In bed',
};

function StageTimeline({ session, width }: { session: SleepSession; width: number }) {
  const total = session.end.getTime() - session.start.getTime();
  if (total <= 0) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Sleep stage timeline from ${session.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} to ${session.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
      style={{ width, height: 44, borderRadius: 10, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.bg.bottom }}
    >
      {session.stages.map((stage, i) => {
        const left = ((stage.start.getTime() - session.start.getTime()) / total) * width;
        const w = Math.max(1, ((stage.end.getTime() - stage.start.getTime()) / total) * width);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left,
              width: w,
              top: stage.stage === 'awake' ? 0 : stage.stage === 'rem' ? 10 : stage.stage === 'deep' ? 30 : 20,
              height: 12,
              borderRadius: 3,
              backgroundColor: STAGE_COLOR[stage.stage],
            }}
          />
        );
      })}
    </View>
  );
}

function sleepScore(session: SleepSession, goalHours: number): number {
  const durationScore = Math.min(1, session.asleepHours / goalHours) * 60;
  const stageMs = (stage: SleepStage) =>
    session.stages
      .filter((s) => s.stage === stage)
      .reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0);
  const asleepMs = Math.max(1, session.asleepHours * 3_600_000);
  const deepShare = stageMs('deep') / asleepMs;
  const remShare = stageMs('rem') / asleepMs;
  // ~20% deep and ~22% REM are healthy adult shares; score proximity to that.
  const deepScore = Math.max(0, 1 - Math.abs(deepShare - 0.2) / 0.2) * 20;
  const remScore = Math.max(0, 1 - Math.abs(remShare - 0.22) / 0.22) * 20;
  return Math.round(Math.min(100, durationScore + deepScore + remScore));
}

export default function SleepScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lastNight = useHealthStore((s) => s.today?.lastNightSleep ?? null);
  const goalHours = useGoalsStore((s) => s.sleepHours);
  const [week, setWeek] = useState<SleepSession[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { service } = await resolveCurrentSource();
      const now = new Date();
      const sessions = await service.getSleepSessions({ start: addDays(now, -7), end: now });
      if (!cancelled) setWeek(sessions);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const breakdown = useMemo(() => {
    if (!lastNight) return [];
    const totals = new Map<SleepStage, number>();
    for (const s of lastNight.stages) {
      totals.set(s.stage, (totals.get(s.stage) ?? 0) + (s.end.getTime() - s.start.getTime()));
    }
    return [...totals.entries()]
      .map(([stage, ms]) => ({ stage, hours: ms / 3_600_000 }))
      .sort((a, b) => b.hours - a.hours);
  }, [lastNight]);

  const cardWidth = width - 40 - 32;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
        <PText variant="h2">Sleep</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {lastNight ? (
          <>
            <Card style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <Ring
                size={150}
                strokeWidth={13}
                progress={sleepScore(lastNight, goalHours) / 100}
                color={colors.accent.sleep}
              >
                <PText variant="display" color={colors.accent.sleep}>
                  {sleepScore(lastNight, goalHours)}
                </PText>
                <PText variant="caption" tone="secondary">
                  sleep score
                </PText>
              </Ring>
              <PText variant="h2">{formatHoursAsHm(lastNight.asleepHours)} asleep</PText>
              <PText variant="caption" tone="tertiary">
                {lastNight.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} —{' '}
                {lastNight.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </PText>
            </Card>

            <Card style={{ gap: 12 }}>
              <PText variant="h2">Last night's stages</PText>
              <StageTimeline session={lastNight} width={cardWidth} />
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                {(['awake', 'rem', 'light', 'deep'] as const).map((stage) => (
                  <View key={stage} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STAGE_COLOR[stage] }} />
                    <PText variant="caption" tone="tertiary">
                      {STAGE_LABEL[stage]}
                    </PText>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ gap: 10 }}>
              <PText variant="h2">Breakdown</PText>
              {breakdown.map(({ stage, hours }) => (
                <View key={stage} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: STAGE_COLOR[stage] }} />
                  <PText variant="body" style={{ flex: 1 }}>
                    {STAGE_LABEL[stage]}
                  </PText>
                  <PText variant="body" tone="secondary">
                    {formatHoursAsHm(hours)}
                  </PText>
                </View>
              ))}
            </Card>
          </>
        ) : (
          <Card>
            <EmptyState
              icon={MoonStar}
              title="No sleep data yet"
              body="iPhone records sleep when Sleep Focus is set up in the Health app, or when a watch tracks your night. Last night will show here."
            />
          </Card>
        )}

        {week.length > 1 ? (
          <Card style={{ gap: 12 }}>
            <PText variant="h2">7-night trend</PText>
            <Sparkline
              data={week.map((s) => s.asleepHours)}
              width={cardWidth}
              height={60}
              color={colors.accent.sleep}
            />
            <PText variant="caption" tone="tertiary">
              Goal: {formatHoursAsHm(goalHours)} · average{' '}
              {formatHoursAsHm(week.reduce((a, s) => a + s.asleepHours, 0) / week.length)}
            </PText>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

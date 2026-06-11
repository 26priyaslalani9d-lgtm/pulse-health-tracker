import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft } from 'lucide-react-native';

import { HourlyBars } from '@/components/charts/HourlyBars';
import { WeekBars } from '@/components/charts/WeekBars';
import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { Ring } from '@/components/ui/Ring';
import { Screen } from '@/components/ui/Screen';
import { StatPill } from '@/components/ui/StatPill';
import { colors, type MetricKind } from '@/lib/tokens';
import { dayKey, lastNDayKeys, weekdayShort } from '@/lib/dates';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { selectDisplayedSteps, useHealthStore } from '@/stores/useHealthStore';

interface MetricDetailScreenProps {
  kind: MetricKind;
}

const META: Record<
  MetricKind,
  { title: string; unit: string; color: string; goalKey: 'steps' | 'distanceKm' | 'calories'; decimals: number }
> = {
  steps: { title: 'Steps', unit: '', color: colors.accent.steps, goalKey: 'steps', decimals: 0 },
  distance: { title: 'Distance', unit: 'km', color: colors.accent.distance, goalKey: 'distanceKm', decimals: 2 },
  calories: { title: 'Calories', unit: 'kcal', color: colors.accent.calories, goalKey: 'calories', decimals: 0 },
};

/** Shared detail screen for steps / distance / calories. */
export function MetricDetailScreen({ kind }: MetricDetailScreenProps) {
  const router = useRouter();
  const meta = META[kind];
  const today = useHealthStore((s) => s.today);
  const liveStepDelta = useHealthStore((s) => s.liveStepDelta);
  const history = useHealthStore((s) => s.history);
  const hourlyToday = useHealthStore((s) => s.hourlyToday);
  const goals = useGoalsStore();
  const goal = goals[meta.goalKey];

  const [goalEditor, setGoalEditor] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(goal));

  const value =
    kind === 'steps'
      ? selectDisplayedSteps({ today, liveStepDelta })
      : kind === 'distance'
        ? (today?.distanceKm ?? 0)
        : (today?.calories ?? 0);

  const byDate = useMemo(() => new Map(history.map((d) => [d.date, d])), [history]);
  const todayKey = dayKey(new Date());

  const week = lastNDayKeys(7).map((key) => {
    const day = byDate.get(key);
    const isToday = key === todayKey;
    const dayValue = isToday
      ? value
      : kind === 'steps'
        ? (day?.steps ?? 0)
        : kind === 'distance'
          ? (day?.distanceKm ?? 0)
          : (day?.calories ?? 0);
    return { label: weekdayShort(key), value: dayValue, isToday };
  });

  // Hourly: steps come straight from cache; distance/calories scale the step
  // shape (honest approximation — the OS only stores hourly steps locally).
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const steps = hourlyToday.find((r) => r.hour === h)?.steps ?? 0;
    if (kind === 'steps') return steps;
    const todaySteps = Math.max(1, today?.steps ?? 1);
    return (steps / todaySteps) * value;
  });

  const weekValues = week.map((w) => w.value);
  const avg = weekValues.reduce((a, b) => a + b, 0) / Math.max(weekValues.length, 1);
  const best = Math.max(...weekValues);

  const format = (v: number) =>
    meta.decimals === 0 ? Math.round(v).toLocaleString() : v.toFixed(meta.decimals);

  const saveGoal = () => {
    const parsed = Number(goalDraft);
    if (parsed > 0) {
      // Persisted; streaks re-evaluate going forward only (computed live from goal).
      goals.setGoal({ [meta.goalKey]: parsed });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setGoalEditor(false);
  };

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
        <PText variant="h2">{meta.title}</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Pressable
          onLongPress={() => {
            setGoalDraft(String(goal));
            setGoalEditor(true);
            void Haptics.selectionAsync();
          }}
          delayLongPress={350}
          accessibilityLabel={`${meta.title} today: ${format(value)} of ${format(goal)} goal. Long-press to edit the goal.`}
        >
          <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 26 }}>
            <Ring size={170} strokeWidth={15} progress={value / Math.max(goal, 0.001)} color={meta.color}>
              <PText variant="display" color={meta.color}>
                {format(value)}
              </PText>
              <PText variant="caption" tone="secondary">
                of {format(goal)} {meta.unit}
              </PText>
            </Ring>
            <PText variant="caption" tone="tertiary">
              {Math.round((value / Math.max(goal, 0.001)) * 100)}% of goal · long-press to edit goal
            </PText>
          </Card>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <StatPill label="avg" value={format(avg)} color={meta.color} />
          <StatPill label="best" value={format(best)} color={meta.color} />
          <StatPill label="goal" value={format(goal)} />
        </View>

        <Card style={{ gap: 12 }}>
          <PText variant="h2">Last 7 days</PText>
          <WeekBars
            data={week}
            color={meta.color}
            accessibilitySummary={`Bar chart of ${meta.title} for the last 7 days. Today: ${format(value)}. Weekly average: ${format(avg)}.`}
          />
        </Card>

        <Card style={{ gap: 12 }}>
          <PText variant="h2">Today by hour</PText>
          <HourlyBars
            values={hourly}
            color={meta.color}
            accessibilitySummary={`Hourly ${meta.title} chart for today.`}
          />
          {kind !== 'steps' ? (
            <PText variant="caption" tone="tertiary">
              Hourly shape estimated from your step pattern.
            </PText>
          ) : null}
        </Card>
      </ScrollView>

      <Modal visible={goalEditor} transparent animationType="fade" onRequestClose={() => setGoalEditor(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000C8', justifyContent: 'center', padding: 28 }}>
          <Card style={{ gap: 14 }}>
            <PText variant="h2">Edit {meta.title.toLowerCase()} goal</PText>
            <TextInput
              value={goalDraft}
              onChangeText={setGoalDraft}
              keyboardType="numeric"
              autoFocus
              accessibilityLabel={`${meta.title} goal`}
              style={{
                backgroundColor: colors.bg.bottom,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text.primary,
                fontFamily: 'SpaceGrotesk_700Bold',
                fontSize: 22,
              }}
            />
            <PText variant="caption" tone="tertiary">
              Streaks use the new goal from today forward — history is never rewritten.
            </PText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setGoalEditor(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 999, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <PText tone="secondary">Cancel</PText>
              </Pressable>
              <Pressable
                onPress={saveGoal}
                accessibilityRole="button"
                accessibilityLabel="Save goal"
                style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 999, backgroundColor: meta.color }}
              >
                <PText color="#0A0A0B" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  Save
                </PText>
              </Pressable>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}

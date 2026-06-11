import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Dumbbell } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { WorkoutChip, WORKOUT_LABEL } from '@/components/ui/WorkoutChip';
import { colors } from '@/lib/tokens';
import { monthDayLabel } from '@/lib/dates';
import { formatDurationMin } from '@/lib/format';
import { useHealthStore } from '@/stores/useHealthStore';

/** Recent workouts (HealthKit merged with in-app recordings). */
export function WorkoutSummaryCard() {
  const router = useRouter();
  const workouts = useHealthStore((s) => s.recentWorkouts);
  const recent = workouts.slice(0, 4);

  return (
    <Card style={{ gap: 4 }}>
      <PressableScale
        onPress={() => router.push('/workouts')}
        accessibilityRole="button"
        accessibilityLabel="Open all workouts"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PText variant="h2">Workouts</PText>
          <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />
        </View>
      </PressableScale>

      {recent.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          body="Record one with the + button — it will appear here and in Apple Health."
        />
      ) : (
        <View style={{ gap: 2, marginTop: 6 }}>
          {recent.map((w) => (
            <PressableScale
              key={w.id}
              onPress={() => router.push({ pathname: '/workouts/[id]', params: { id: w.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${WORKOUT_LABEL[w.type]} on ${monthDayLabel(w.start)}, ${formatDurationMin(w.durationMin)}, ${Math.round(w.calories)} kilocalories`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <WorkoutChip type={w.type} />
                <View style={{ flex: 1 }}>
                  <PText variant="body" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {WORKOUT_LABEL[w.type]}
                  </PText>
                  <PText variant="caption" tone="tertiary">
                    {monthDayLabel(w.start)} · {formatDurationMin(w.durationMin)}
                  </PText>
                </View>
                <PText variant="body" color={colors.accent.calories}>
                  {Math.round(w.calories)} kcal
                </PText>
              </View>
            </PressableScale>
          ))}
        </View>
      )}
    </Card>
  );
}

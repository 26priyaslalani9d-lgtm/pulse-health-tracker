import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Dumbbell, Plus } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { WorkoutChip, WORKOUT_LABEL } from '@/components/ui/WorkoutChip';
import { colors } from '@/lib/tokens';
import { monthDayLabel } from '@/lib/dates';
import { formatDurationMin } from '@/lib/format';
import { useHealthStore } from '@/stores/useHealthStore';
import { isDistanceWorkout } from '@/types/health';

const FILTERS = ['All', 'Walk', 'Run', 'Ride', 'Strength', 'Yoga', 'Other'] as const;

export default function WorkoutsScreen() {
  const router = useRouter();
  const workouts = useHealthStore((s) => s.recentWorkouts);
  const [filter, setFilter] = useState<string>('All');

  const visible = useMemo(() => {
    if (filter === 'All') return workouts;
    return workouts.filter((w) => WORKOUT_LABEL[w.type] === filter || (filter === 'Other' && !['Walk', 'Run', 'Ride', 'Strength', 'Yoga'].includes(WORKOUT_LABEL[w.type])));
  }, [workouts, filter]);

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
        <PText variant="h2" style={{ flex: 1 }}>
          Workouts
        </PText>
        <Pressable
          onPress={() => router.push('/record-workout')}
          accessibilityRole="button"
          accessibilityLabel="Start a workout"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: colors.accent.steps,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginRight: 8,
            minHeight: 38,
          }}
        >
          <Plus size={15} color="#04150A" strokeWidth={2.2} />
          <PText variant="caption" color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Start
          </PText>
        </Pressable>
      </View>

      <View style={{ marginTop: 10 }}>
        <CategoryTabs categories={FILTERS} selected={filter} onSelect={setFilter} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 10 }} showsVerticalScrollIndicator={false}>
        {visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={Dumbbell}
              title="Nothing here yet"
              body="Workouts from Apple Health and ones you record in Pulse both show up in this list."
            />
          </Card>
        ) : (
          visible.map((w) => (
            <PressableScale
              key={w.id}
              onPress={() => router.push({ pathname: '/workouts/[id]', params: { id: w.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${WORKOUT_LABEL[w.type]}, ${monthDayLabel(w.start)}, ${formatDurationMin(w.durationMin)}`}
            >
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <WorkoutChip type={w.type} />
                <View style={{ flex: 1 }}>
                  <PText variant="body" style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {WORKOUT_LABEL[w.type]}
                    {w.source === 'pulse' ? '  · Pulse' : ''}
                  </PText>
                  <PText variant="caption" tone="tertiary">
                    {monthDayLabel(w.start)} ·{' '}
                    {w.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ·{' '}
                    {formatDurationMin(w.durationMin)}
                    {isDistanceWorkout(w) && w.distanceKm > 0 ? ` · ${w.distanceKm.toFixed(2)} km` : ''}
                  </PText>
                </View>
                <PText variant="body" color={colors.accent.calories}>
                  {Math.round(w.calories)} kcal
                </PText>
              </Card>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { ChevronLeft, Share2 } from 'lucide-react-native';

import { TrendLine } from '@/components/charts/TrendLine';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { StatPill } from '@/components/ui/StatPill';
import { WorkoutChip, WORKOUT_LABEL } from '@/components/ui/WorkoutChip';
import { colors } from '@/lib/tokens';
import { debug } from '@/lib/debug';
import { formatDurationMin } from '@/lib/format';
import { resolveCurrentSource } from '@/services/sync';
import { useHealthStore } from '@/stores/useHealthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { isDistanceWorkout, type HeartRateSample } from '@/types/health';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotRef = useRef<ViewShotRef>(null);
  const workouts = useHealthStore((s) => s.recentWorkouts);
  const recorded = useWorkoutStore((s) => s.recorded);
  const [hrCurve, setHrCurve] = useState<HeartRateSample[]>([]);

  const workout = workouts.find((w) => w.id === id);
  const stored = recorded.find((r) => r.id === id);

  useEffect(() => {
    if (!workout) return;
    // Prefer the HR curve captured live during a Pulse recording.
    if (stored?.hrCurve && stored.hrCurve.length > 1) {
      setHrCurve(stored.hrCurve.map((p) => ({ bpm: p.bpm, date: new Date(p.t) })));
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { service } = await resolveCurrentSource();
      const samples = await service.getHeartRateSamples({ start: workout.start, end: workout.end });
      if (!cancelled) setHrCurve(samples);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [workout, stored]);

  const onShare = async () => {
    try {
      const uri = await shotRef.current?.capture?.();
      if (uri && workout) {
        await Share.share({
          url: uri,
          message: `${WORKOUT_LABEL[workout.type]} · ${formatDurationMin(workout.durationMin)} · ${Math.round(workout.calories)} kcal — tracked with Pulse`,
        });
      }
    } catch (e) {
      debug('share', 'workout share failed', e);
    }
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
        <PText variant="h2" style={{ flex: 1 }}>
          Workout
        </PText>
        {workout ? (
          <Pressable
            onPress={() => void onShare()}
            accessibilityRole="button"
            accessibilityLabel="Share workout image"
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Share2 size={19} color={colors.text.secondary} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {!workout ? (
          <Card>
            <EmptyState
              icon={ChevronLeft}
              title="Workout not found"
              body="It may have been removed from your health store."
            />
          </Card>
        ) : (
          <>
            <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
              <Card style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <WorkoutChip type={workout.type} size={48} />
                  <View>
                    <PText variant="h2">{WORKOUT_LABEL[workout.type]}</PText>
                    <PText variant="caption" tone="tertiary">
                      {workout.start.toLocaleString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {workout.source === 'pulse' ? ' · recorded in Pulse' : ''}
                    </PText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill label="time" value={formatDurationMin(workout.durationMin)} color={colors.accent.steps} />
                  <StatPill label="kcal" value={`${Math.round(workout.calories)}`} color={colors.accent.calories} />
                  {isDistanceWorkout(workout) && workout.distanceKm > 0 ? (
                    <StatPill label="km" value={workout.distanceKm.toFixed(2)} color={colors.accent.distance} />
                  ) : null}
                  {isDistanceWorkout(workout) && workout.steps ? (
                    <StatPill label="steps" value={workout.steps.toLocaleString()} color={colors.accent.steps} />
                  ) : null}
                </View>
              </Card>
            </ViewShot>

            {hrCurve.length > 1 ? (
              <Card style={{ gap: 12 }}>
                <PText variant="h2">Heart rate during workout</PText>
                <TrendLine
                  data={hrCurve.map((s) => ({ x: s.date.getTime(), y: s.bpm }))}
                  color={colors.accent.heart}
                  height={150}
                  xLabels={['start', 'finish']}
                  accessibilitySummary={`Heart rate during the workout, ${hrCurve.length} samples.`}
                />
              </Card>
            ) : (
              <Card>
                <PText variant="caption" tone="tertiary">
                  No heart-rate samples during this workout — a watch or strap would fill this
                  chart.
                </PText>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

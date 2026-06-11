import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Pause, Play, Square, X } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { WorkoutChip, WORKOUT_LABEL } from '@/components/ui/WorkoutChip';
import { colors } from '@/lib/tokens';
import { debug } from '@/lib/debug';
import { formatDurationMs } from '@/lib/format';
import { resolveCurrentSource, syncNow } from '@/services/sync';
import { strideMetersFor, useProfileStore } from '@/stores/useProfileStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import type { WorkoutType } from '@/types/health';

const TYPES: WorkoutType[] = ['walking', 'running', 'cycling', 'hiking', 'strength', 'yoga', 'other'];

/** Metabolic equivalents for calorie estimation (kcal = MET × kg × hours). */
const MET: Record<WorkoutType, number> = {
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  hiking: 6,
  strength: 5,
  yoga: 3,
  swimming: 8,
  other: 5,
};

type Phase = 'pick' | 'live' | 'saving';

export default function RecordWorkoutScreen() {
  useKeepAwake();
  const router = useRouter();
  const weight = useProfileStore((s) => s.weight);
  const height = useProfileStore((s) => s.height);
  const addRecorded = useWorkoutStore((s) => s.addRecorded);
  const today = useHealthStore((s) => s.today);

  const [phase, setPhase] = useState<Phase>('pick');
  const [type, setType] = useState<WorkoutType>('walking');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);

  const startedAt = useRef<Date | null>(null);
  const pausedAccum = useRef(0);
  const lastTick = useRef(0);
  const stepsUnsub = useRef<(() => void) | null>(null);
  const stepBaseline = useRef(0);
  const hrCurve = useRef<{ t: string; bpm: number }[]>([]);

  // tick the clock
  useEffect(() => {
    if (phase !== 'live') return;
    const interval = setInterval(() => {
      if (!paused && startedAt.current) {
        setElapsedMs(Date.now() - startedAt.current.getTime() - pausedAccum.current);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, paused]);

  // capture a sparse live HR curve from the latest store sample
  useEffect(() => {
    if (phase !== 'live' || !today?.latestHeartRate) return;
    const last = hrCurve.current[hrCurve.current.length - 1];
    const sample = { t: today.latestHeartRate.date.toISOString(), bpm: today.latestHeartRate.bpm };
    if (!last || last.t !== sample.t) hrCurve.current.push(sample);
  }, [phase, today?.latestHeartRate]);

  const start = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startedAt.current = new Date();
    pausedAccum.current = 0;
    hrCurve.current = [];
    setElapsedMs(0);
    setLiveSteps(0);
    setPhase('live');
    const { service } = await resolveCurrentSource();
    stepBaseline.current = -1;
    stepsUnsub.current = service.observeTodaySteps((cumulative) => {
      if (stepBaseline.current === -1) stepBaseline.current = cumulative;
      setLiveSteps(Math.max(0, cumulative - stepBaseline.current));
    });
  };

  const togglePause = () => {
    void Haptics.selectionAsync();
    if (paused) {
      pausedAccum.current += Date.now() - lastTick.current;
    } else {
      lastTick.current = Date.now();
    }
    setPaused(!paused);
  };

  const elapsedHours = elapsedMs / 3_600_000;
  const estCalories = Math.round(MET[type] * Math.max(weight, 30) * elapsedHours);
  const estDistanceKm =
    type === 'walking' || type === 'running' || type === 'hiking'
      ? (liveSteps * strideMetersFor(height)) / 1000
      : undefined;

  const finish = async () => {
    if (!startedAt.current) return;
    setPhase('saving');
    stepsUnsub.current?.();
    const end = new Date();
    const start_ = startedAt.current;
    const durationMin = Math.max(0.5, elapsedMs / 60_000);

    const draft = {
      type,
      start: start_,
      end,
      calories: estCalories,
      distanceKm: estDistanceKm,
      steps: liveSteps > 0 ? liveSteps : undefined,
    };

    try {
      // Write to the platform store so it shows in Apple Health too.
      const { service } = await resolveCurrentSource();
      await service.saveWorkout(draft);
    } catch (e) {
      debug('workout', 'platform save failed (kept locally)', e);
    }

    addRecorded({
      id: `pulse-${start_.getTime()}`,
      type,
      start: start_.toISOString(),
      end: end.toISOString(),
      durationMin,
      calories: estCalories,
      distanceKm: estDistanceKm,
      steps: liveSteps > 0 ? liveSteps : undefined,
      hrCurve: hrCurve.current.length > 1 ? hrCurve.current : undefined,
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await syncNow();
    router.back();
  };

  useEffect(() => () => stepsUnsub.current?.(), []);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
        <PText variant="h2">{phase === 'pick' ? 'Start workout' : WORKOUT_LABEL[type]}</PText>
        <Pressable
          onPress={() => {
            stepsUnsub.current?.();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Cancel workout"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={22} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
      </View>

      {phase === 'pick' ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
          <PText variant="caption" tone="secondary" style={{ marginBottom: 6 }}>
            Pick an activity. Pulse times it, counts live steps, estimates burn from your weight,
            and saves the workout to {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'}{' '}
            when you finish.
          </PText>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              accessibilityRole="button"
              accessibilityState={{ selected: type === t }}
              accessibilityLabel={WORKOUT_LABEL[t]}
            >
              <Card
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: type === t ? colors.accent.steps : colors.cardBorder,
                }}
              >
                <WorkoutChip type={t} />
                <PText variant="body" style={{ fontFamily: 'Inter_600SemiBold', flex: 1 }}>
                  {WORKOUT_LABEL[t]}
                </PText>
                <PText variant="caption" tone="tertiary">
                  ~{Math.round(MET[t] * Math.max(weight, 30))} kcal/h
                </PText>
              </Card>
            </Pressable>
          ))}
          <Pressable
            onPress={() => void start()}
            accessibilityRole="button"
            accessibilityLabel={`Start ${WORKOUT_LABEL[type]}`}
            style={{
              backgroundColor: colors.accent.steps,
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Play size={18} color="#04150A" strokeWidth={2} fill="#04150A" />
            <PText color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Start {WORKOUT_LABEL[type]}
            </PText>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', gap: 22, marginTop: 30 }}>
            <WorkoutChip type={type} size={64} />
            <PText
              style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 64, lineHeight: 72 }}
              color={paused ? colors.text.tertiary : colors.text.primary}
              accessibilityLabel={`Elapsed time ${formatDurationMs(elapsedMs)}`}
            >
              {formatDurationMs(elapsedMs)}
            </PText>
            {paused ? (
              <PText variant="caption" color={colors.warning}>
                Paused
              </PText>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <Card style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <PText variant="number" color={colors.accent.steps}>
                  {liveSteps.toLocaleString()}
                </PText>
                <PText variant="caption" tone="tertiary">
                  live steps
                </PText>
              </Card>
              <Card style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <PText variant="number" color={colors.accent.calories}>
                  {estCalories}
                </PText>
                <PText variant="caption" tone="tertiary">
                  est. kcal
                </PText>
              </Card>
              {today?.latestHeartRate ? (
                <Card style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <PText variant="number" color={colors.accent.heart}>
                    {Math.round(today.latestHeartRate.bpm)}
                  </PText>
                  <PText variant="caption" tone="tertiary">
                    bpm
                  </PText>
                </Card>
              ) : null}
            </View>
            {estDistanceKm !== undefined ? (
              <PText variant="caption" tone="tertiary">
                ≈ {estDistanceKm.toFixed(2)} km from stride length
              </PText>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 14, justifyContent: 'center', paddingBottom: 30 }}>
            <Pressable
              onPress={togglePause}
              disabled={phase === 'saving'}
              accessibilityRole="button"
              accessibilityLabel={paused ? 'Resume workout' : 'Pause workout'}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {paused ? (
                <Play size={26} color={colors.text.primary} strokeWidth={2} />
              ) : (
                <Pause size={26} color={colors.text.primary} strokeWidth={2} />
              )}
            </Pressable>
            <Pressable
              onPress={() => void finish()}
              disabled={phase === 'saving'}
              accessibilityRole="button"
              accessibilityLabel="Finish and save workout"
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.accent.calories,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: phase === 'saving' ? 0.6 : 1,
              }}
            >
              <Square size={24} color="#1A0505" strokeWidth={2} fill="#1A0505" />
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}

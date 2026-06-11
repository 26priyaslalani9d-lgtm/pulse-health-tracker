import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { HeartHandshake, ShieldCheck } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PText } from '@/components/ui/PText';
import { Ring } from '@/components/ui/Ring';
import { Screen } from '@/components/ui/Screen';
import { TriRing } from '@/components/ui/TriRing';
import { colors } from '@/lib/tokens';
import { platformService } from '@/services/health';
import { syncNow } from '@/services/sync';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useProfileStore, type Sex, type Units } from '@/stores/useProfileStore';

const inputStyle = {
  backgroundColor: colors.bg.bottom,
  borderColor: colors.cardBorder,
  borderWidth: 1,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: colors.text.primary,
  fontFamily: 'Inter_400Regular',
  fontSize: 14,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboard?: 'default' | 'numeric';
}) {
  return (
    <View style={{ gap: 6 }}>
      <PText variant="caption" tone="secondary">
        {label}
      </PText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType={keyboard}
        style={inputStyle}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onSelect,
  labels,
}: {
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labels?.[opt] ?? opt}
            style={{
              flex: 1,
              paddingVertical: 11,
              borderRadius: 999,
              alignItems: 'center',
              backgroundColor: active ? `${colors.accent.steps}22` : colors.bg.bottom,
              borderWidth: 1,
              borderColor: active ? colors.accent.steps : colors.cardBorder,
              minHeight: 44,
            }}
          >
            <PText variant="caption" color={active ? colors.accent.steps : colors.text.secondary}>
              {labels?.[opt] ?? opt}
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}

function GoalStepper({
  label,
  value,
  step,
  min,
  max,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  unit: string;
  color: string;
  onChange: (v: number) => void;
}) {
  const bump = (dir: 1 | -1) => {
    onChange(Math.min(max, Math.max(min, Math.round((value + dir * step) * 10) / 10)));
  };
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <PText variant="caption" tone="secondary">
          {label}
        </PText>
        <PText variant="number" color={color}>
          {value % 1 === 0 ? value.toLocaleString() : value.toFixed(1)} {unit}
        </PText>
      </View>
      {([-1, 1] as const).map((dir) => (
        <Pressable
          key={dir}
          onPress={() => bump(dir)}
          accessibilityRole="button"
          accessibilityLabel={`${dir === 1 ? 'Increase' : 'Decrease'} ${label}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            backgroundColor: colors.bg.bottom,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PText variant="h2" tone="secondary">
            {dir === 1 ? '+' : '−'}
          </PText>
        </Pressable>
      ))}
    </Card>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const goals = useGoalsStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [dob, setDob] = useState(profile.dob);
  const [sex, setSex] = useState<Sex>(profile.sex || 'other');
  const [height, setHeight] = useState(String(profile.height || ''));
  const [weight, setWeight] = useState(String(profile.weight || ''));
  const [units, setUnits] = useState<Units>(profile.units);
  const [backfill, setBackfill] = useState<number | null>(null);
  const [error, setError] = useState('');

  const validateProfile = (): boolean => {
    if (!name.trim()) {
      setError('Tell us your name — it makes the greeting feel like home.');
      return false;
    }
    const h = Number(height);
    const w = Number(weight);
    if (!h || h < 90 || h > 250) {
      setError('Height should be between 90 and 250 cm (it feeds stride estimates).');
      return false;
    }
    if (!w || w < 25 || w > 350) {
      setError('Weight should be between 25 and 350 kg.');
      return false;
    }
    setError('');
    profile.setProfile({ name: name.trim(), dob, sex, height: h, weight: w, units });
    return true;
  };

  const finish = async (requestPermission: boolean) => {
    if (requestPermission) {
      setBackfill(0);
      await platformService.requestPermissions();
      await syncNow({ backfill: true, onBackfillProgress: setBackfill });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    profile.completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: i <= step ? colors.accent.steps : colors.cardBorder,
                }}
              />
            ))}
          </View>

          {step === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <TriRing size={180} steps={0.78} distance={0.55} calories={0.92} />
              <View style={{ alignItems: 'center', gap: 8 }}>
                <PText variant="display">Pulse</PText>
                <PText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                  Your phone already counts every step.{'\n'}Pulse turns that into something
                  beautiful.
                </PText>
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: 14 }}>
              <PText variant="display">About you</PText>
              <PText variant="caption" tone="secondary">
                Height feeds stride estimates when the OS gives no distance. Everything stays on
                this device.
              </PText>
              <Field label="Name" value={name} onChange={setName} placeholder="Alex" />
              <Field label="Date of birth (YYYY-MM-DD)" value={dob} onChange={setDob} placeholder="1998-04-12" />
              <View style={{ gap: 6 }}>
                <PText variant="caption" tone="secondary">
                  Sex
                </PText>
                <ChipRow
                  options={['female', 'male', 'other'] as const}
                  value={sex === '' ? 'other' : sex}
                  onSelect={setSex}
                />
              </View>
              <Field label="Height (cm)" value={height} onChange={setHeight} placeholder="170" keyboard="numeric" />
              <Field label="Weight (kg)" value={weight} onChange={setWeight} placeholder="70" keyboard="numeric" />
              <View style={{ gap: 6 }}>
                <PText variant="caption" tone="secondary">
                  Units
                </PText>
                <ChipRow
                  options={['metric', 'imperial'] as const}
                  value={units}
                  onSelect={setUnits}
                  labels={{ metric: 'Metric (km)', imperial: 'Imperial (mi)' }}
                />
              </View>
              {error ? (
                <PText variant="caption" color={colors.danger}>
                  {error}
                </PText>
              ) : null}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: 14 }}>
              <PText variant="display">Daily goals</PText>
              <PText variant="caption" tone="secondary">
                Sensible defaults — adjust any time with a long-press on a detail screen.
              </PText>
              <GoalStepper
                label="Steps"
                value={goals.steps}
                step={500}
                min={2000}
                max={40000}
                unit=""
                color={colors.accent.steps}
                onChange={(v) => goals.setGoal({ steps: v })}
              />
              <GoalStepper
                label="Distance"
                value={goals.distanceKm}
                step={0.5}
                min={1}
                max={42}
                unit="km"
                color={colors.accent.distance}
                onChange={(v) => goals.setGoal({ distanceKm: v })}
              />
              <GoalStepper
                label="Active calories"
                value={goals.calories}
                step={50}
                min={100}
                max={2000}
                unit="kcal"
                color={colors.accent.calories}
                onChange={(v) => goals.setGoal({ calories: v })}
              />
              <GoalStepper
                label="Sleep"
                value={goals.sleepHours}
                step={0.5}
                min={4}
                max={12}
                unit="h"
                color={colors.accent.sleep}
                onChange={(v) => goals.setGoal({ sleepHours: v })}
              />
            </View>
          ) : null}

          {step === 3 ? (
            <View style={{ flex: 1, gap: 16, justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    backgroundColor: `${colors.accent.steps}1C`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HeartHandshake size={40} color={colors.accent.steps} strokeWidth={1.5} />
                </View>
                <PText variant="display" style={{ textAlign: 'center' }}>
                  {Platform.OS === 'ios' ? 'Connect Apple Health' : 'Connect Health Connect'}
                </PText>
                <PText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
                  Pulse reads steps, distance, energy, heart rate, sleep and workouts to draw your
                  dashboard — and writes back workouts you record here.
                </PText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color={colors.accent.steps} strokeWidth={1.75} />
                  <PText variant="caption" tone="secondary">
                    Health data never leaves this device.
                  </PText>
                </View>
              </View>

              {backfill !== null ? (
                <Card style={{ gap: 10, alignItems: 'center' }}>
                  <Ring size={64} strokeWidth={7} progress={backfill} color={colors.accent.steps} />
                  <PText variant="caption" tone="secondary">
                    Backfilling 90 days of history… {Math.round(backfill * 100)}%
                  </PText>
                </Card>
              ) : null}
            </View>
          ) : null}

          <View style={{ gap: 10, marginTop: 'auto', paddingBottom: 20 }}>
            <Pressable
              disabled={backfill !== null && backfill < 1}
              onPress={() => {
                void Haptics.selectionAsync();
                if (step === 1 && !validateProfile()) return;
                if (step < 3) setStep(step + 1);
                else void finish(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={step < 3 ? 'Continue' : 'Connect health data and finish'}
              style={{
                backgroundColor: colors.accent.steps,
                borderRadius: 999,
                paddingVertical: 15,
                alignItems: 'center',
                opacity: backfill !== null && backfill < 1 ? 0.6 : 1,
              }}
            >
              <PText color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {step === 0
                  ? 'Get started'
                  : step < 3
                    ? 'Continue'
                    : backfill !== null
                      ? 'Connecting…'
                      : Platform.OS === 'ios'
                        ? 'Connect Apple Health'
                        : 'Connect Health Connect'}
              </PText>
            </Pressable>
            {step === 3 && backfill === null ? (
              <Pressable
                onPress={() => void finish(false)}
                accessibilityRole="button"
                accessibilityLabel="Skip health connection and use demo data"
                style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
              >
                <PText variant="caption" tone="secondary">
                  Not now — show me demo data instead
                </PText>
              </Pressable>
            ) : null}
            {step > 0 && step < 3 ? (
              <Pressable
                onPress={() => setStep(step - 1)}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
              >
                <PText variant="caption" tone="tertiary">
                  Back
                </PText>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

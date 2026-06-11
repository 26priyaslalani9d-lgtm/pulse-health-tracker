import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Droplets, HeartPulse, MoonStar } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { relativeTime } from '@/lib/dates';
import { formatHoursAsHm } from '@/lib/format';
import { useHealthStore } from '@/stores/useHealthStore';
import { stressLabel, useStressStore } from '@/stores/useStressStore';

/** Heart rate / Sleep / SpO₂ / Stress cards (2-up grid). */
export function VitalsCards() {
  const router = useRouter();
  const today = useHealthStore((s) => s.today);
  const stressEntries = useStressStore((s) => s.entries);
  const latestStress = stressEntries[0];

  const hr = today?.latestHeartRate ?? null;
  const sleep = today?.lastNightSleep ?? null;
  const oxygen = today?.latestOxygen ?? null;

  const half = { flex: 1 } as const;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PressableScale
          style={half}
          onPress={() => router.push('/heart-rate')}
          accessibilityRole="button"
          accessibilityLabel="Heart rate details"
        >
          <Card style={{ gap: 8, minHeight: 116 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <HeartPulse size={18} color={colors.accent.heart} strokeWidth={1.75} />
              <PText variant="caption" tone="secondary">
                Heart rate
              </PText>
            </View>
            {hr ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <PText variant="number" color={colors.accent.heart}>
                    {Math.round(hr.bpm)}
                  </PText>
                  <PText variant="caption" tone="tertiary">
                    bpm
                  </PText>
                </View>
                <PText variant="caption" tone="tertiary">
                  {relativeTime(hr.date)}
                  {today?.averageHeartRate
                    ? ` · avg ${Math.round(today.averageHeartRate)}`
                    : ''}
                </PText>
              </>
            ) : (
              <PText variant="caption" tone="secondary">
                No HR source — connect a watch or log manually.
              </PText>
            )}
          </Card>
        </PressableScale>

        <PressableScale
          style={half}
          onPress={() => router.push('/sleep')}
          accessibilityRole="button"
          accessibilityLabel="Sleep details"
        >
          <Card style={{ gap: 8, minHeight: 116 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MoonStar size={18} color={colors.accent.sleep} strokeWidth={1.75} />
              <PText variant="caption" tone="secondary">
                Sleep
              </PText>
            </View>
            {sleep ? (
              <>
                <PText variant="number" color={colors.accent.sleep}>
                  {formatHoursAsHm(sleep.asleepHours)}
                </PText>
                <PText variant="caption" tone="tertiary">
                  last night
                </PText>
              </>
            ) : (
              <PText variant="caption" tone="secondary">
                No sleep recorded yet. Keep your phone nearby overnight.
              </PText>
            )}
          </Card>
        </PressableScale>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PressableScale
          style={half}
          onPress={() => router.push('/spo2')}
          accessibilityRole="button"
          accessibilityLabel="Blood oxygen details"
        >
          <Card style={{ gap: 8, minHeight: 116 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Droplets size={18} color={colors.accent.spo2} strokeWidth={1.75} />
              <PText variant="caption" tone="secondary">
                Blood oxygen
              </PText>
            </View>
            {oxygen ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <PText variant="number" color={colors.accent.spo2}>
                    {Math.round(oxygen.percentage)}
                  </PText>
                  <PText variant="caption" tone="tertiary">
                    %
                  </PText>
                </View>
                <PText variant="caption" tone="tertiary">
                  {relativeTime(oxygen.date)}
                </PText>
              </>
            ) : (
              <PText variant="caption" tone="secondary">
                No SpO₂ source on this phone.
              </PText>
            )}
          </Card>
        </PressableScale>

        <PressableScale
          style={half}
          onPress={() => router.push('/stress')}
          accessibilityRole="button"
          accessibilityLabel="Stress check-in"
        >
          <Card style={{ gap: 8, minHeight: 116 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color={colors.accent.stress} strokeWidth={1.75} />
              <PText variant="caption" tone="secondary">
                Stress
              </PText>
            </View>
            {latestStress ? (
              <>
                <PText variant="number" color={colors.accent.stress}>
                  {latestStress.level}
                </PText>
                <PText variant="caption" tone="tertiary">
                  {stressLabel(latestStress.level)} · manual check-in
                </PText>
              </>
            ) : (
              <PText variant="caption" tone="secondary">
                Manual check-in — iOS has no stress sensor, so we ask you.
              </PText>
            )}
          </Card>
        </PressableScale>
      </View>
    </View>
  );
}

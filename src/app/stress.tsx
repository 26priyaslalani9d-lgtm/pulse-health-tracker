import { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Activity, ChevronLeft } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PText } from '@/components/ui/PText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Sparkline } from '@/components/ui/Sparkline';
import { colors } from '@/lib/tokens';
import { stressLabel, useStressStore } from '@/stores/useStressStore';

export default function StressScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const entries = useStressStore((s) => s.entries);
  const addEntry = useStressStore((s) => s.addEntry);
  const [draft, setDraft] = useState(40);

  const latest = entries[0];

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
        <PText variant="h2">Stress</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: 4 }}>
          <PText variant="caption" tone="secondary">
            Phones can't measure stress — iOS has no stress API. So Pulse asks you instead:
            a quick 0–100 check-in, kept privately on this device.
          </PText>
        </Card>

        <Card style={{ gap: 16, alignItems: 'center', paddingVertical: 22 }}>
          <PText variant="display" color={colors.accent.stress}>
            {draft}
          </PText>
          <PText variant="caption" tone="secondary">
            {stressLabel(draft)}
          </PText>
          <View style={{ width: '100%' }}>
            <ProgressBar progress={draft / 100} color={colors.accent.stress} height={10} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
            {[-10, -5, +5, +10].map((delta) => (
              <Pressable
                key={delta}
                onPress={() => setDraft((d) => Math.min(100, Math.max(0, d + delta)))}
                accessibilityRole="button"
                accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} by ${Math.abs(delta)}`}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 999,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.bg.bottom,
                  minHeight: 44,
                }}
              >
                <PText variant="caption" tone="secondary">
                  {delta > 0 ? `+${delta}` : delta}
                </PText>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => {
              addEntry(draft);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            accessibilityRole="button"
            accessibilityLabel="Save stress check-in"
            style={{
              backgroundColor: colors.accent.stress,
              borderRadius: 999,
              paddingVertical: 13,
              paddingHorizontal: 36,
              minHeight: 44,
            }}
          >
            <PText color="#160A02" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Check in
            </PText>
          </Pressable>
        </Card>

        {entries.length > 1 ? (
          <Card style={{ gap: 12 }}>
            <PText variant="h2">Trend</PText>
            <Sparkline
              data={[...entries].reverse().map((e) => e.level)}
              width={width - 72}
              height={56}
              color={colors.accent.stress}
            />
          </Card>
        ) : null}

        {entries.length > 0 ? (
          <Card style={{ gap: 4 }}>
            <PText variant="h2" style={{ marginBottom: 6 }}>
              History
            </PText>
            {entries.slice(0, 14).map((e) => (
              <View key={e.at} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <PText variant="body" tone="secondary">
                  {new Date(e.at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </PText>
                <PText variant="body" color={colors.accent.stress}>
                  {e.level} · {stressLabel(e.level)}
                </PText>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon={Activity}
              title="No check-ins yet"
              body="Log how you feel a couple of times a day to see your pattern."
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

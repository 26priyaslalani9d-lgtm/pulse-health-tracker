import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Droplets } from 'lucide-react-native';

import { TrendLine } from '@/components/charts/TrendLine';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/lib/tokens';
import { addDays, relativeTime } from '@/lib/dates';
import { resolveCurrentSource } from '@/services/sync';
import type { OxygenSample } from '@/types/health';

export default function Spo2Screen() {
  const router = useRouter();
  const [samples, setSamples] = useState<OxygenSample[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { service } = await resolveCurrentSource();
      const now = new Date();
      const result = await service.getOxygenSamples({ start: addDays(now, -7), end: now });
      if (!cancelled) {
        setSamples(result);
        setLoaded(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = samples[samples.length - 1];

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
        <PText variant="h2">Blood oxygen</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
          <Droplets size={28} color={colors.accent.spo2} strokeWidth={1.75} />
          {latest ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <PText variant="display" color={colors.accent.spo2}>
                  {Math.round(latest.percentage)}
                </PText>
                <PText variant="body" tone="secondary">
                  %
                </PText>
              </View>
              <PText variant="caption" tone="tertiary">
                {relativeTime(latest.date)}
              </PText>
            </>
          ) : loaded ? (
            <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
              No SpO₂ source on this phone — readings appear when a watch or pulse oximeter
              writes them to your health store.
            </PText>
          ) : null}
        </Card>

        {samples.length > 1 ? (
          <Card style={{ gap: 12 }}>
            <PText variant="h2">Last 7 days</PText>
            <TrendLine
              data={samples.map((s) => ({ x: s.date.getTime(), y: s.percentage }))}
              color={colors.accent.spo2}
              height={150}
              xLabels={['7d ago', 'now']}
              accessibilitySummary={`Blood oxygen trend, latest ${latest ? Math.round(latest.percentage) : 0} percent.`}
            />
          </Card>
        ) : null}

        {samples.length > 0 ? (
          <Card style={{ gap: 4 }}>
            <PText variant="h2" style={{ marginBottom: 6 }}>
              Readings
            </PText>
            {samples
              .slice(-12)
              .reverse()
              .map((s, i) => (
                <View
                  key={i}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}
                >
                  <PText variant="body" tone="secondary">
                    {s.date.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </PText>
                  <PText variant="body" color={colors.accent.spo2}>
                    {Math.round(s.percentage)}%
                  </PText>
                </View>
              ))}
          </Card>
        ) : loaded ? (
          <Card>
            <EmptyState
              icon={Droplets}
              title="No readings"
              body="SpO₂ needs hardware your phone doesn't have on its own."
            />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

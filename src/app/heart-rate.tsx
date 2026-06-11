import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, HeartPulse } from 'lucide-react-native';

import { TrendLine, type ZoneBand } from '@/components/charts/TrendLine';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { StatPill } from '@/components/ui/StatPill';
import { colors } from '@/lib/tokens';
import { addDays, relativeTime, startOfDay } from '@/lib/dates';
import { resolveCurrentSource } from '@/services/sync';
import { useHealthStore } from '@/stores/useHealthStore';
import type { HeartRateSample } from '@/types/health';

const RANGES = ['Day', 'Week', 'Month'] as const;

const ZONES: ZoneBand[] = [
  { from: 40, to: 90, color: colors.accent.sleep, label: 'Resting' },
  { from: 90, to: 120, color: colors.accent.steps, label: 'Fat burn' },
  { from: 120, to: 150, color: colors.accent.distance, label: 'Cardio' },
  { from: 150, to: 190, color: colors.accent.calories, label: 'Peak' },
];

export default function HeartRateScreen() {
  const router = useRouter();
  const today = useHealthStore((s) => s.today);
  const [range, setRange] = useState(0);
  const [samples, setSamples] = useState<HeartRateSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { service } = await resolveCurrentSource();
      const now = new Date();
      const start =
        range === 0 ? startOfDay(now) : range === 1 ? addDays(now, -7) : addDays(now, -30);
      const result = await service.getHeartRateSamples({ start, end: now });
      if (!cancelled) {
        // thin long ranges so the chart stays smooth
        const stride = Math.max(1, Math.floor(result.length / 300));
        setSamples(result.filter((_, i) => i % stride === 0));
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const stats = useMemo(() => {
    if (samples.length === 0) return null;
    const values = samples.map((s) => s.bpm);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }, [samples]);

  const chartData = samples.map((s) => ({ x: s.date.getTime(), y: s.bpm }));
  const latest = today?.latestHeartRate;

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
        <PText variant="h2">Heart rate</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
          <HeartPulse size={28} color={colors.accent.heart} strokeWidth={1.75} />
          {latest ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <PText variant="display" color={colors.accent.heart}>
                  {Math.round(latest.bpm)}
                </PText>
                <PText variant="body" tone="secondary">
                  bpm
                </PText>
              </View>
              <PText variant="caption" tone="tertiary">
                {relativeTime(latest.date)}
                {today?.averageHeartRate
                  ? ` · All day average ${Math.round(today.averageHeartRate)} BPM`
                  : ''}
              </PText>
            </>
          ) : (
            <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
              No heart-rate source on this phone. Connect a watch or chest strap — readings will
              appear here automatically.
            </PText>
          )}
        </Card>

        <SegmentedTabs tabs={RANGES} selected={range} onSelect={setRange} color={colors.accent.heart} />

        {chartData.length > 1 ? (
          <Card style={{ gap: 12 }}>
            <TrendLine
              data={chartData}
              color={colors.accent.heart}
              zones={ZONES}
              height={200}
              xLabels={range === 0 ? ['midnight', 'noon', 'now'] : range === 1 ? ['7d ago', 'now'] : ['30d ago', 'now']}
              accessibilitySummary={
                stats
                  ? `Heart rate chart. Minimum ${Math.round(stats.min)}, average ${Math.round(stats.avg)}, maximum ${Math.round(stats.max)} beats per minute.`
                  : 'Heart rate chart.'
              }
            />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {ZONES.map((z) => (
                <View key={z.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: z.color }} />
                  <PText variant="caption" tone="tertiary">
                    {z.label}
                  </PText>
                </View>
              ))}
            </View>
          </Card>
        ) : !loading ? (
          <Card>
            <EmptyState
              icon={HeartPulse}
              title="No samples in this range"
              body="Heart-rate data appears once a sensor (watch, strap or phone camera app) writes to your health store."
            />
          </Card>
        ) : null}

        {stats ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <StatPill label="min" value={`${Math.round(stats.min)}`} color={colors.accent.sleep} />
            <StatPill label="avg" value={`${Math.round(stats.avg)}`} color={colors.accent.heart} />
            <StatPill label="max" value={`${Math.round(stats.max)}`} color={colors.accent.calories} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

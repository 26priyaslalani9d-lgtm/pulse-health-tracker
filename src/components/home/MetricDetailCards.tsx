import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Flame, Footprints, MapPin } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { formatInt, formatKm } from '@/lib/format';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { selectDisplayedSteps, useHealthStore } from '@/stores/useHealthStore';

/** Step / Distance / Calories cards with % captions and arrows to detail screens. */
export function MetricDetailCards() {
  const router = useRouter();
  const today = useHealthStore((s) => s.today);
  const liveStepDelta = useHealthStore((s) => s.liveStepDelta);
  const goals = useGoalsStore();

  const steps = selectDisplayedSteps({ today, liveStepDelta });
  const rows = [
    {
      route: '/steps' as const,
      icon: Footprints,
      label: 'Steps',
      value: formatInt(steps),
      pct: Math.round((steps / Math.max(goals.steps, 1)) * 100),
      goal: formatInt(goals.steps),
      color: colors.accent.steps,
    },
    {
      route: '/distance' as const,
      icon: MapPin,
      label: 'Distance',
      value: `${formatKm(today?.distanceKm ?? 0)} km`,
      pct: Math.round(((today?.distanceKm ?? 0) / Math.max(goals.distanceKm, 0.01)) * 100),
      goal: `${formatKm(goals.distanceKm, 2)} km`,
      color: colors.accent.distance,
    },
    {
      route: '/calories' as const,
      icon: Flame,
      label: 'Calories',
      value: `${formatInt(today?.calories ?? 0)} kcal`,
      pct: Math.round(((today?.calories ?? 0) / Math.max(goals.calories, 1)) * 100),
      goal: `${formatInt(goals.calories)} kcal`,
      color: colors.accent.calories,
    },
  ];

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <PressableScale
          key={row.label}
          onPress={() => router.push(row.route)}
          accessibilityRole="button"
          accessibilityLabel={`${row.label} ${row.value}, ${row.pct} percent of goal. Open details.`}
        >
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: `${row.color}1F`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <row.icon size={20} color={row.color} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1 }}>
              <PText variant="caption" tone="secondary">
                {row.label} · {row.pct}% of {row.goal}
              </PText>
              <PText variant="number" color={row.color}>
                {row.value}
              </PText>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={1.75} />
          </Card>
        </PressableScale>
      ))}
    </View>
  );
}

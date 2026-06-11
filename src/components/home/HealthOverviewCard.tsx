import { useRef } from 'react';
import { Pressable, Share, View } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Share2 } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { TriRing } from '@/components/ui/TriRing';
import { useCountUp } from '@/lib/useCountUp';
import { colors } from '@/lib/tokens';
import { debug } from '@/lib/debug';
import { formatInt, formatKm } from '@/lib/format';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { selectDisplayedSteps, useHealthStore } from '@/stores/useHealthStore';

interface MetricRowProps {
  label: string;
  valueText: string;
  goalText: string;
  color: string;
}

function MetricRow({ label, valueText, goalText, color }: MetricRowProps) {
  return (
    <View style={{ gap: 1 }}>
      <PText variant="caption" tone="secondary">
        {label}
      </PText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <PText variant="number" color={color}>
          {valueText}
        </PText>
        <PText variant="caption" tone="tertiary">
          / {goalText}
        </PText>
      </View>
    </View>
  );
}

interface HealthOverviewCardProps {
  spinTrigger: number;
}

/** The hero card: live metric column + tri-concentric ring, shareable as PNG. */
export function HealthOverviewCard({ spinTrigger }: HealthOverviewCardProps) {
  const shotRef = useRef<ViewShotRef>(null);
  const today = useHealthStore((s) => s.today);
  const liveStepDelta = useHealthStore((s) => s.liveStepDelta);
  const goals = useGoalsStore();

  const steps = selectDisplayedSteps({ today, liveStepDelta });
  const distanceKm = today?.distanceKm ?? 0;
  const calories = today?.calories ?? 0;

  const animSteps = useCountUp(steps);
  const animDistance = useCountUp(distanceKm);
  const animCalories = useCountUp(calories);

  const onShare = async () => {
    try {
      const uri = await shotRef.current?.capture?.();
      if (uri) await Share.share({ url: uri, message: 'My day with Pulse' });
    } catch (e) {
      debug('share', 'share failed', e);
    }
  };

  return (
    <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PText variant="h2">Health overview</PText>
          <Pressable
            onPress={() => void onShare()}
            accessibilityRole="button"
            accessibilityLabel="Share health overview"
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Share2 size={18} color={colors.text.secondary} strokeWidth={1.75} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 14, flex: 1 }}>
            <MetricRow
              label="Steps"
              valueText={formatInt(animSteps)}
              goalText={formatInt(goals.steps)}
              color={colors.accent.steps}
            />
            <MetricRow
              label="Distance"
              valueText={formatKm(animDistance)}
              goalText={`${formatKm(goals.distanceKm, 2)} km`}
              color={colors.accent.distance}
            />
            <MetricRow
              label="Calories"
              valueText={formatInt(animCalories)}
              goalText={`${formatInt(goals.calories)} kcal`}
              color={colors.accent.calories}
            />
          </View>
          <TriRing
            size={140}
            steps={steps / Math.max(goals.steps, 1)}
            distance={distanceKm / Math.max(goals.distanceKm, 0.01)}
            calories={calories / Math.max(goals.calories, 1)}
            spinTrigger={spinTrigger}
          />
        </View>
      </Card>
    </ViewShot>
  );
}

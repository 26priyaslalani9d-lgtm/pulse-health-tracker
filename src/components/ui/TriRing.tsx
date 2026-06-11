import { View } from 'react-native';

import { colors } from '@/lib/tokens';
import { Ring } from './Ring';

interface TriRingProps {
  /** outer diameter, ~140 per the brief */
  size?: number;
  /** 0..1 each */
  steps: number;
  distance: number;
  calories: number;
  spinTrigger?: number;
}

/**
 * Tri-concentric health ring: outer = steps (green), middle = distance
 * (yellow), inner = calories (red). Staggered 1.2s fills.
 */
export function TriRing({ size = 140, steps, distance, calories, spinTrigger }: TriRingProps) {
  const stroke = size * 0.085;
  const gap = stroke + size * 0.025;
  const midSize = size - 2 * gap;
  const innerSize = size - 4 * gap;

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel={`Activity rings. Steps ${Math.round(steps * 100)} percent, distance ${Math.round(distance * 100)} percent, calories ${Math.round(calories * 100)} percent of goal.`}
    >
      <View style={{ position: 'absolute' }}>
        <Ring
          size={size}
          strokeWidth={stroke}
          progress={steps}
          color={colors.accent.steps}
          spinTrigger={spinTrigger}
        />
      </View>
      <View style={{ position: 'absolute' }}>
        <Ring
          size={midSize}
          strokeWidth={stroke}
          progress={distance}
          color={colors.accent.distance}
          delay={150}
          spinTrigger={spinTrigger}
        />
      </View>
      <View style={{ position: 'absolute' }}>
        <Ring
          size={innerSize}
          strokeWidth={stroke}
          progress={calories}
          color={colors.accent.calories}
          delay={300}
          spinTrigger={spinTrigger}
        />
      </View>
    </View>
  );
}

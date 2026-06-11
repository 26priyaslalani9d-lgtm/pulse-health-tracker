import { View } from 'react-native';
import {
  Bike,
  Dumbbell,
  Flower2,
  Footprints,
  Mountain,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

import { colors } from '@/lib/tokens';
import type { WorkoutType } from '@/types/health';

const ICONS: Record<WorkoutType, LucideIcon> = {
  walking: Footprints,
  running: Zap,
  cycling: Bike,
  hiking: Mountain,
  strength: Dumbbell,
  yoga: Flower2,
  swimming: Waves,
  other: Zap,
};

export const WORKOUT_LABEL: Record<WorkoutType, string> = {
  walking: 'Walk',
  running: 'Run',
  cycling: 'Ride',
  hiking: 'Hike',
  strength: 'Strength',
  yoga: 'Yoga',
  swimming: 'Swim',
  other: 'Workout',
};

interface WorkoutChipProps {
  type: WorkoutType;
  size?: number;
}

/** Round green workout-type icon chip. */
export function WorkoutChip({ type, size = 40 }: WorkoutChipProps) {
  const Icon = ICONS[type];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${colors.accent.steps}1F`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={`${WORKOUT_LABEL[type]} icon`}
    >
      <Icon size={size * 0.5} color={colors.accent.steps} strokeWidth={1.75} />
    </View>
  );
}

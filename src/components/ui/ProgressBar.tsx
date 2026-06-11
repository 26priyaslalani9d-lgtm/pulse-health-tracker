import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  color: string;
  height?: number;
  trackOpacity?: number;
}

export function ProgressBar({ progress, color, height = 8, trackOpacity = 0.15 }: ProgressBarProps) {
  const width = useSharedValue(0);
  const reduceMotion = useReduceMotion();
  const clamped = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    width.value = reduceMotion
      ? clamped
      : withTiming(clamped, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduceMotion, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: color,
        opacity: 1,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          opacity: 1 - trackOpacity,
        }}
      />
      <Animated.View
        style={[
          { height: '100%', borderRadius: height / 2, backgroundColor: color },
          fillStyle,
        ]}
      />
    </View>
  );
}

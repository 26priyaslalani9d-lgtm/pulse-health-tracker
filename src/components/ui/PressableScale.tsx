import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/useReduceMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Card press feedback: scale to 0.985 (disabled under Reduce Motion). */
export function PressableScale({ style, ...rest }: PressableProps & { style?: object }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        if (!reduceMotion) scale.value = withTiming(0.985, { duration: 90 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 140 });
        rest.onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
    />
  );
}

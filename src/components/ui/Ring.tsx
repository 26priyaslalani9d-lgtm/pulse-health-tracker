import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useReduceMotion } from '@/lib/useReduceMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  size: number;
  strokeWidth: number;
  /** 0..1 (values > 1 are clamped) */
  progress: number;
  color: string;
  /** ms before the fill starts (for staggering) */
  delay?: number;
  /** show the end-cap dot in the ring colour */
  endCap?: boolean;
  children?: React.ReactNode;
  /** bump this number to trigger a 360° spin (sync animation) */
  spinTrigger?: number;
}

const FILL_MS = 1200;
const EASING = Easing.out(Easing.cubic);

/**
 * Single progress ring: round line caps, 12%-opacity track, end-cap dot,
 * 1.2s ease-out-cubic fill (instant under Reduce Motion).
 */
export function Ring({
  size,
  strokeWidth,
  progress,
  color,
  delay = 0,
  endCap = true,
  children,
  spinTrigger = 0,
}: RingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const animated = useSharedValue(0);
  const spin = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      animated.value = clamped;
    } else {
      animated.value = withDelay(delay, withTiming(clamped, { duration: FILL_MS, easing: EASING }));
    }
  }, [clamped, delay, reduceMotion, animated]);

  // 360° ring-spin on sync (brief §5.1)
  useEffect(() => {
    if (spinTrigger > 0 && !reduceMotion) {
      spin.value = 0;
      spin.value = withTiming(360, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    }
  }, [spinTrigger, reduceMotion, spin]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const dotProps = useAnimatedProps(() => {
    const angle = animated.value * 2 * Math.PI - Math.PI / 2;
    return {
      cx: size / 2 + r * Math.cos(angle),
      cy: size / 2 + r * Math.sin(angle),
      opacity: animated.value > 0.01 ? 1 : 0,
    };
  });

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, spinStyle]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          opacity={0.12}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          animatedProps={circleProps}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {endCap ? (
          <AnimatedCircle animatedProps={dotProps} r={strokeWidth / 2 + 1.5} fill={color} />
        ) : null}
      </Svg>
      {children ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      ) : null}
    </Animated.View>
  );
}

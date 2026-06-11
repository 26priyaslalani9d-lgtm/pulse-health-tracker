import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface SegmentedTabsProps {
  tabs: readonly string[];
  selected: number;
  onSelect: (index: number) => void;
  /** underline accent */
  color?: string;
}

/** Tab row with a sliding underline (Challenges New/Joined, Day/Week/Month). */
export function SegmentedTabs({ tabs, selected, onSelect, color = colors.accent.streak }: SegmentedTabsProps) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const tabWidth = width / Math.max(tabs.length, 1);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const underline = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  if (tabWidth > 0) {
    x.value = withTiming(selected * tabWidth, { duration: 220, easing: Easing.out(Easing.cubic) });
  }

  return (
    <View onLayout={onLayout}>
      <View style={{ flexDirection: 'row' }}>
        {tabs.map((tab, i) => (
          <Pressable
            key={tab}
            onPress={() => onSelect(i)}
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', minHeight: 44 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === selected }}
            accessibilityLabel={tab}
          >
            <PText variant="body" tone={i === selected ? 'primary' : 'secondary'}>
              {tab}
            </PText>
          </Pressable>
        ))}
      </View>
      <View style={{ height: 2, backgroundColor: colors.cardBorder }}>
        {tabWidth > 0 ? (
          <Animated.View
            style={[
              { width: tabWidth, height: 2, backgroundColor: color, borderRadius: 1 },
              underline,
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

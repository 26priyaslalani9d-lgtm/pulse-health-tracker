import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Home, ShoppingBag, Trophy, Watch, type LucideIcon } from 'lucide-react-native';

import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';

const TAB_META: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: Home, label: 'Home' },
  challenges: { icon: Trophy, label: 'Challenges' },
  watchfaces: { icon: Watch, label: 'Watch faces' },
  shop: { icon: ShoppingBag, label: 'Shop' },
};

/** Floating translucent tab bar with a glowing pill that morphs between tabs. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const pillX = useSharedValue(0);
  const tabCount = state.routes.length;
  const tabWidth = barWidth / Math.max(tabCount, 1);

  useEffect(() => {
    if (tabWidth > 0) {
      pillX.value = withTiming(state.index * tabWidth + 6, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state.index, tabWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: Math.max(insets.bottom, 12),
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
        onLayout={onLayout}
      >
        <BlurView intensity={40} tint="dark" style={{ backgroundColor: '#16161CDD' }}>
          <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
            {tabWidth > 0 ? (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: 8,
                    bottom: 8,
                    width: tabWidth - 12,
                    borderRadius: 20,
                    backgroundColor: `${colors.accent.steps}1C`,
                    borderWidth: 1,
                    borderColor: `${colors.accent.steps}55`,
                    shadowColor: colors.accent.steps,
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  },
                  pillStyle,
                ]}
              />
            ) : null}
            {state.routes.map((route, index) => {
              const meta = TAB_META[route.name] ?? TAB_META.index!;
              const focused = state.index === index;
              const Icon = meta.icon;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={meta.label}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 7,
                    gap: 3,
                    minHeight: 48,
                  }}
                >
                  <Icon
                    size={20}
                    color={focused ? colors.accent.steps : colors.text.tertiary}
                    strokeWidth={1.75}
                  />
                  <PText
                    variant="caption"
                    color={focused ? colors.accent.steps : colors.text.tertiary}
                  >
                    {meta.label}
                  </PText>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

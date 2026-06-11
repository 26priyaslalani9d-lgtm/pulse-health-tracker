import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface GoldPillProps {
  label: string;
  onPress?: () => void;
}

/** Gold gradient call-to-action pill. */
export function GoldPill({ label, onPress }: GoldPillProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ minHeight: 44, justifyContent: 'center' }}>
      <LinearGradient
        colors={[colors.gold.from, colors.gold.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}
      >
        <PText variant="body" color="#1A1304" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {label}
        </PText>
      </LinearGradient>
    </Pressable>
  );
}

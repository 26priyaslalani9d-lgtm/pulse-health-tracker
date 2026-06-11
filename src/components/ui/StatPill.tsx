import { View } from 'react-native';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface StatPillProps {
  label: string;
  value: string;
  color?: string;
}

/** Small min/avg/max-style stat chip. */
export function StatPill({ label, value, color = colors.text.primary }: StatPillProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
      }}
    >
      <PText variant="caption" tone="secondary">
        {label}
      </PText>
      <PText variant="body" color={color} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
        {value}
      </PText>
    </View>
  );
}

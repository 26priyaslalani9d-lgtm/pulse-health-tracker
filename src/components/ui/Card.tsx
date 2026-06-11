import { View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '@/lib/tokens';

/** Standard Pulse card: #1C1C22, 1px #23232A border, 20px radius, 16px padding. */
export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderWidth: 1,
          borderRadius: radius.card,
          padding: spacing.cardPad,
        },
        style,
      ]}
    />
  );
}

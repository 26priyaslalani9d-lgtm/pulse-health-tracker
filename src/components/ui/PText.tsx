import { Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/lib/tokens';

type Variant = 'display' | 'h2' | 'body' | 'caption' | 'number';
type Tone = 'primary' | 'secondary' | 'tertiary';

interface PTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  color?: string;
}

const variantStyle: Record<Variant, { fontSize: number; lineHeight: number; fontFamily: string }> = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: fonts.display },
  h2: { fontSize: 18, lineHeight: 24, fontFamily: fonts.semibold },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
  number: { fontSize: 24, lineHeight: 30, fontFamily: fonts.display },
};

const toneColor: Record<Tone, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
};

/** Typed text primitive enforcing the Pulse type scale. */
export function PText({ variant = 'body', tone = 'primary', color, style, ...rest }: PTextProps) {
  return (
    <Text
      {...rest}
      style={[variantStyle[variant], { color: color ?? toneColor[tone] }, style]}
    />
  );
}

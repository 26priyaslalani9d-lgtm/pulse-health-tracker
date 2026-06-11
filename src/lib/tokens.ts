/**
 * Pulse design tokens — single source of truth.
 * Mirrored in tailwind.config.js for NativeWind class usage.
 * Use these constants anywhere a raw value is needed (SVG, Skia, navigation).
 */

export const colors = {
  bg: {
    top: '#0A0A0B',
    bottom: '#0F0F12',
  },
  card: '#1C1C22',
  cardBorder: '#23232A',
  accent: {
    steps: '#34D26A',
    distance: '#F5C518',
    calories: '#FF4D4D',
    heart: '#FF3B7A',
    streak: '#8B5CF6',
    sleep: '#5EA0EF',
    spo2: '#4DD0E1',
    stress: '#F97316',
  },
  gold: {
    from: '#E8C46A',
    to: '#B8862C',
  },
  text: {
    primary: '#F5F5F7',
    secondary: '#A1A1AA',
    tertiary: '#6B6B73',
  },
  success: '#34D26A',
  warning: '#F5C518',
  danger: '#FF4D4D',
} as const;

export const radius = {
  card: 20,
  pill: 999,
  control: 14,
} as const;

export const spacing = {
  page: 20,
  cardGap: 16,
  cardPad: 16,
} as const;

export const fonts = {
  /** UI text */
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Big numerals / display */
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
} as const;

export const type = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: fonts.display },
  h2: { fontSize: 18, lineHeight: 24, fontFamily: fonts.semibold },
  body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.regular },
} as const;

export type MetricKind = 'steps' | 'distance' | 'calories';

export const metricAccent: Record<MetricKind, string> = {
  steps: colors.accent.steps,
  distance: colors.accent.distance,
  calories: colors.accent.calories,
};

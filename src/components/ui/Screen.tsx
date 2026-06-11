import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/lib/tokens';

interface ScreenProps extends ViewProps {
  /** apply top safe-area padding (off for screens with custom headers) */
  safeTop?: boolean;
}

/** Full-screen background: #0A0A0B → #0F0F12 gradient per the design system. */
export function Screen({ style, safeTop = true, children, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View {...rest} style={[{ flex: 1, backgroundColor: colors.bg.top }, style]}>
      <LinearGradient
        colors={[colors.bg.top, colors.bg.bottom]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ flex: 1, paddingTop: safeTop ? insets.top : 0 }}>{children}</View>
    </View>
  );
}

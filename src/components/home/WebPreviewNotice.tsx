import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Smartphone, X } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { useHealthStore } from '@/stores/useHealthStore';

/**
 * Web-only explainer so demo numbers are never mistaken for broken tracking:
 * a browser cannot read Apple Health, so the preview shows sample data.
 */
export function WebPreviewNotice() {
  const source = useHealthStore((s) => s.source);
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== 'web' || source !== 'mock' || dismissed) return null;

  return (
    <Card
      style={{
        marginHorizontal: 20,
        borderColor: `${colors.warning}66`,
        backgroundColor: `${colors.warning}10`,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <Smartphone size={20} color={colors.warning} strokeWidth={1.75} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <PText variant="body" style={{ fontFamily: 'Inter_600SemiBold' }} color={colors.warning}>
          You're viewing the demo preview
        </PText>
        <PText variant="caption" tone="secondary">
          The steps, heart rate and sleep here are sample numbers — a website can't count
          your real steps. Today's demo number stays still; it isn't stuck. Install Pulse on
          your iPhone to track real movement from Apple Health.
        </PText>
      </View>
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss demo notice"
        style={{ minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={16} color={colors.text.tertiary} strokeWidth={1.75} />
      </Pressable>
    </Card>
  );
}

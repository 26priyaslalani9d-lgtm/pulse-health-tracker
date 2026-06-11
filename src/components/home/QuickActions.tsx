import { Linking, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, HeartHandshake, Link2, Phone } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { useHealthStore } from '@/stores/useHealthStore';

interface QuickActionsProps {
  onShowPermissionSheet: () => void;
  onShowCallingSheet: () => void;
}

/** 4-up quick action chips: Pair / Calling / Notifications / Apple Health. */
export function QuickActions({ onShowPermissionSheet, onShowCallingSheet }: QuickActionsProps) {
  const router = useRouter();
  const permission = useHealthStore((s) => s.permission);
  const connected = permission === 'granted';

  const openHealthApp = () => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('x-apple-health://').catch(() => Linking.openSettings());
    } else {
      void Linking.openSettings();
    }
  };

  const actions = [
    {
      label: 'Pair',
      icon: Link2,
      dot: connected,
      onPress: onShowPermissionSheet,
      a11y: connected ? 'Health connected' : 'Connect health data',
    },
    {
      label: 'Calling',
      icon: Phone,
      dot: false,
      onPress: onShowCallingSheet,
      a11y: 'Calling (not available without a watch)',
    },
    {
      label: 'Alerts',
      icon: Bell,
      dot: true,
      onPress: () => router.push('/profile'),
      a11y: 'Notification preferences',
    },
    {
      label: Platform.OS === 'ios' ? 'Health' : 'Connect',
      icon: HeartHandshake,
      dot: connected,
      onPress: openHealthApp,
      a11y: Platform.OS === 'ios' ? 'Open Apple Health' : 'Open Health Connect settings',
    },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {actions.map((action) => (
        <PressableScale
          key={action.label}
          style={{ flex: 1 }}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.a11y}
        >
          <Card style={{ alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 6 }}>
            <View>
              <action.icon size={20} color={colors.text.secondary} strokeWidth={1.75} />
              {action.dot ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: colors.accent.steps,
                  }}
                />
              ) : null}
            </View>
            <PText variant="caption" tone="secondary">
              {action.label}
            </PText>
          </Card>
        </PressableScale>
      ))}
    </View>
  );
}

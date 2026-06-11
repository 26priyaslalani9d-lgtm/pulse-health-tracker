import { Linking, Modal, Platform, Pressable, View } from 'react-native';
import { ShieldAlert, ShieldCheck } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { platformService } from '@/services/health';
import { syncNow } from '@/services/sync';
import { useHealthStore } from '@/stores/useHealthStore';

interface PermissionSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Fix-permissions sheet: a designed state for every permission situation —
 * never a bare alert box (brief §17).
 */
export function PermissionSheet({ visible, onClose }: PermissionSheetProps) {
  const permission = useHealthStore((s) => s.permission);
  const source = useHealthStore((s) => s.source);

  const request = async () => {
    await platformService.requestPermissions();
    await syncNow();
    onClose();
  };

  const granted = permission === 'granted' && source === 'real';
  const storeName = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000AA' }}>
        <View
          style={{
            backgroundColor: colors.bg.bottom,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 36,
            gap: 14,
          }}
        >
          <View style={{ alignItems: 'center', gap: 10 }}>
            {granted ? (
              <ShieldCheck size={40} color={colors.accent.steps} strokeWidth={1.5} />
            ) : (
              <ShieldAlert size={40} color={colors.warning} strokeWidth={1.5} />
            )}
            <PText variant="h2">
              {granted ? `${storeName} connected` : `Connect ${storeName}`}
            </PText>
            <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
              {granted
                ? 'Steps, distance, energy, heart rate, sleep and workouts are flowing into Pulse.'
                : permission === 'unavailable'
                  ? Platform.OS === 'android'
                    ? 'Health Connect is not installed on this device. Install it from the Play Store, then come back.'
                    : 'Health data is not available on this device (Simulator shows demo data instead).'
                  : `Pulse reads your steps, distance, energy, heart rate, sleep and workouts from ${storeName} — nothing ever leaves this phone.`}
            </PText>
          </View>

          {!granted && permission !== 'unavailable' ? (
            <Pressable
              onPress={() => void request()}
              accessibilityRole="button"
              accessibilityLabel={`Connect ${storeName}`}
              style={{
                backgroundColor: colors.accent.steps,
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <PText color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Connect {storeName}
              </PText>
            </Pressable>
          ) : null}

          {permission === 'denied' || permission === 'partial' ? (
            <Card>
              <PText variant="caption" tone="secondary">
                Already denied some types? iOS only lets you change that in Settings → Privacy →
                Health → Pulse.
              </PText>
              <Pressable
                onPress={() => void Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel="Open system settings"
                style={{ marginTop: 10, minHeight: 44, justifyContent: 'center' }}
              >
                <PText color={colors.accent.sleep}>Open Settings</PText>
              </Pressable>
            </Card>
          ) : null}

          {permission === 'unavailable' && Platform.OS === 'android' ? (
            <Pressable
              onPress={() =>
                void Linking.openURL(
                  'market://details?id=com.google.android.apps.healthdata',
                ).catch(() => {})
              }
              accessibilityRole="button"
              accessibilityLabel="Install Health Connect from the Play Store"
              style={{
                backgroundColor: colors.accent.steps,
                borderRadius: 999,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <PText color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Get Health Connect
              </PText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ alignItems: 'center', minHeight: 44, justifyContent: 'center' }}
          >
            <PText tone="secondary">{granted ? 'Done' : 'Not now'}</PText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

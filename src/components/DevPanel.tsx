import { Modal, Pressable, ScrollView, Switch, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { syncNow } from '@/services/sync';
import { wipeDb } from '@/services/db';
import { wipeAllStorage } from '@/stores/storage';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { MockProfile } from '@/services/health';

interface DevPanelProps {
  visible: boolean;
  onClose: () => void;
}

const PROFILES: MockProfile[] = ['sedentary', 'active', 'athlete'];

/** Hidden dev panel (triple-tap the avatar): mock controls, time skip, wipe. */
export function DevPanel({ visible, onClose }: DevPanelProps) {
  const dev = useSettingsStore((s) => s.dev);
  const setDev = useSettingsStore((s) => s.setDev);
  const gold = useProfileStore((s) => s.gold);
  const setProfile = useProfileStore((s) => s.setProfile);

  const apply = async (patch: Parameters<typeof setDev>[0]) => {
    setDev(patch);
    await syncNow();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000AA' }}>
        <View
          style={{
            backgroundColor: colors.bg.bottom,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '80%',
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PText variant="h2">Dev panel</PText>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dev panel" style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <PText tone="secondary">Done</PText>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <PText>Force mock data</PText>
                <Switch
                  value={dev.forceMock}
                  onValueChange={(v) => void apply({ forceMock: v })}
                  accessibilityLabel="Force mock data"
                />
              </View>
            </Card>
            <Card>
              <PText tone="secondary" variant="caption" style={{ marginBottom: 10 }}>
                Mock profile (reseed)
              </PText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PROFILES.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => void apply({ mockProfile: p })}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${p} mock profile`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: dev.mockProfile === p ? colors.accent.steps : colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <PText variant="caption" color={dev.mockProfile === p ? '#04150A' : colors.text.secondary}>
                      {p}
                    </PText>
                  </Pressable>
                ))}
              </View>
            </Card>
            <Card>
              <PText tone="secondary" variant="caption" style={{ marginBottom: 10 }}>
                Time skip (streak testing): {dev.timeSkipDays} days
              </PText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[-7, -1, 0, 1, 7].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => void apply({ timeSkipDays: d === 0 ? 0 : dev.timeSkipDays + d })}
                    accessibilityRole="button"
                    accessibilityLabel={`Skip ${d} days`}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <PText variant="caption">{d === 0 ? 'reset' : d > 0 ? `+${d}` : d}</PText>
                  </Pressable>
                ))}
              </View>
            </Card>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <PText>Gold member</PText>
                <Switch
                  value={gold}
                  onValueChange={(v) => setProfile({ gold: v })}
                  accessibilityLabel="Toggle Gold membership"
                />
              </View>
            </Card>
            <Card>
              <Pressable
                onPress={() => {
                  wipeDb();
                  wipeAllStorage();
                }}
                accessibilityRole="button"
                accessibilityLabel="Wipe all local storage"
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <PText color={colors.danger}>Wipe storage (restart app after)</PText>
              </Pressable>
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

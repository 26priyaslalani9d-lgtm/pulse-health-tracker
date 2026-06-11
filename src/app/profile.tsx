import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ChevronLeft, Download, ShieldCheck, Trash2 } from 'lucide-react-native';

import { PermissionSheet } from '@/components/home/PermissionSheet';
import { Card } from '@/components/ui/Card';
import { GoldPill } from '@/components/ui/GoldPill';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/lib/tokens';
import { debug } from '@/lib/debug';
import { wipeDb } from '@/services/db';
import { wipeAllStorage } from '@/stores/storage';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useProfileStore, type Units } from '@/stores/useProfileStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useStressStore } from '@/stores/useStressStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
      <PText variant="body" tone="secondary">
        {label}
      </PText>
      {children}
    </View>
  );
}

const fieldStyle = {
  backgroundColor: colors.bg.bottom,
  borderColor: colors.cardBorder,
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 8,
  color: colors.text.primary,
  fontFamily: 'Inter_400Regular',
  fontSize: 14,
  minWidth: 110,
  textAlign: 'right' as const,
};

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const goals = useGoalsStore();
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotificationPref = useSettingsStore((s) => s.setNotificationPref);
  const permission = useHealthStore((s) => s.permission);
  const source = useHealthStore((s) => s.source);
  const history = useHealthStore((s) => s.history);
  const recorded = useWorkoutStore((s) => s.recorded);
  const stress = useStressStore((s) => s.entries);

  const [permissionSheet, setPermissionSheet] = useState(false);
  const [name, setName] = useState(profile.name);
  const [height, setHeight] = useState(String(profile.height));
  const [weight, setWeight] = useState(String(profile.weight));

  const commitProfile = () => {
    const h = Number(height);
    const w = Number(weight);
    profile.setProfile({
      name: name.trim() || profile.name,
      height: h > 0 ? h : profile.height,
      weight: w > 0 ? w : profile.weight,
    });
  };

  const exportJson = async () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile: { name: profile.name, dob: profile.dob, sex: profile.sex, height: profile.height, weight: profile.weight, units: profile.units },
        goals: { steps: goals.steps, distanceKm: goals.distanceKm, calories: goals.calories, sleepHours: goals.sleepHours },
        dailyHistory: history,
        recordedWorkouts: recorded,
        stressCheckIns: stress,
      },
      null,
      2,
    );
    try {
      await Share.share({ message: payload });
    } catch (e) {
      debug('export', 'export failed', e);
    }
  };

  const resetAll = () => {
    // double confirm per the brief
    Alert.alert('Reset Pulse?', 'This wipes profile, goals, history cache and favourites on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Really reset everything?', 'There is no undo.', [
            { text: 'Keep my data', style: 'cancel' },
            {
              text: 'Reset everything',
              style: 'destructive',
              onPress: () => {
                wipeDb();
                wipeAllStorage();
                router.replace('/onboarding');
              },
            },
          ]),
      },
    ]);
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 }}>
        <Pressable
          onPress={() => {
            commitProfile();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={24} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
        <PText variant="h2">Profile & settings</PText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: 6 }}>
          <PText variant="h2" style={{ marginBottom: 4 }}>
            You
          </PText>
          <Row label="Name">
            <TextInput value={name} onChangeText={setName} onEndEditing={commitProfile} style={fieldStyle} accessibilityLabel="Name" />
          </Row>
          <Row label="Height (cm)">
            <TextInput value={height} onChangeText={setHeight} onEndEditing={commitProfile} keyboardType="numeric" style={fieldStyle} accessibilityLabel="Height in centimetres" />
          </Row>
          <Row label="Weight (kg)">
            <TextInput value={weight} onChangeText={setWeight} onEndEditing={commitProfile} keyboardType="numeric" style={fieldStyle} accessibilityLabel="Weight in kilograms" />
          </Row>
          <Row label="Units">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['metric', 'imperial'] as Units[]).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => profile.setProfile({ units: u })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: profile.units === u }}
                  accessibilityLabel={`${u} units`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: profile.units === u ? `${colors.accent.steps}22` : colors.bg.bottom,
                    borderWidth: 1,
                    borderColor: profile.units === u ? colors.accent.steps : colors.cardBorder,
                  }}
                >
                  <PText variant="caption" color={profile.units === u ? colors.accent.steps : colors.text.secondary}>
                    {u === 'metric' ? 'km' : 'mi'}
                  </PText>
                </Pressable>
              ))}
            </View>
          </Row>
        </Card>

        <Card style={{ gap: 6 }}>
          <PText variant="h2" style={{ marginBottom: 4 }}>
            Notifications
          </PText>
          <Row label="Goal reached">
            <Switch
              value={notifications.goalReached}
              onValueChange={(v) => setNotificationPref({ goalReached: v })}
              accessibilityLabel="Goal reached notifications"
            />
          </Row>
          <Row label="Streak at risk (8 PM)">
            <Switch
              value={notifications.streakAtRisk}
              onValueChange={(v) => setNotificationPref({ streakAtRisk: v })}
              accessibilityLabel="Streak at risk notifications"
            />
          </Row>
          <Row label="Challenges">
            <Switch
              value={notifications.challenges}
              onValueChange={(v) => setNotificationPref({ challenges: v })}
              accessibilityLabel="Challenge notifications"
            />
          </Row>
        </Card>

        <Card style={{ gap: 10 }}>
          <PText variant="h2">Health connection</PText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: permission === 'granted' && source === 'real' ? colors.accent.steps : colors.warning,
              }}
            />
            <PText variant="caption" tone="secondary">
              {source === 'real'
                ? `Connected to ${Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} (${permission})`
                : `Demo data (${permission})`}
            </PText>
          </View>
          <Pressable
            onPress={() => setPermissionSheet(true)}
            accessibilityRole="button"
            accessibilityLabel="Manage health connection"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <PText color={colors.accent.sleep}>Manage connection</PText>
          </Pressable>
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PText variant="h2" color={profile.gold ? colors.gold.from : colors.text.primary}>
              Pulse Gold
            </PText>
            <PText variant="caption" tone="secondary">
              {profile.gold ? 'Active — streak freezes & custom challenges unlocked.' : 'Streak freezes, custom challenges, gold faces.'}
            </PText>
          </View>
          {!profile.gold ? (
            <GoldPill label="Upgrade" onPress={() => profile.setProfile({ gold: true })} />
          ) : null}
        </Card>

        <Card style={{ gap: 6 }}>
          <Pressable
            onPress={() => void exportJson()}
            accessibilityRole="button"
            accessibilityLabel="Export all data as JSON"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
          >
            <Download size={18} color={colors.text.secondary} strokeWidth={1.75} />
            <PText>Export data (JSON)</PText>
          </Pressable>
          <Pressable
            onPress={resetAll}
            accessibilityRole="button"
            accessibilityLabel="Reset all data"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
          >
            <Trash2 size={18} color={colors.danger} strokeWidth={1.75} />
            <PText color={colors.danger}>Reset everything</PText>
          </Pressable>
        </Card>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color={colors.accent.steps} strokeWidth={1.75} />
            <PText variant="caption" tone="tertiary">
              Local-first. Health data never leaves this device.
            </PText>
          </View>
          <PText variant="caption" tone="tertiary">
            Pulse {Constants.expoConfig?.version ?? '1.0.0'}
          </PText>
        </View>
      </ScrollView>

      <PermissionSheet visible={permissionSheet} onClose={() => setPermissionSheet(false)} />
    </Screen>
  );
}

import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBadge } from '@/components/home/DemoBadge';
import { HealthOverviewCard } from '@/components/home/HealthOverviewCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { MetricDetailCards } from '@/components/home/MetricDetailCards';
import { PermissionSheet } from '@/components/home/PermissionSheet';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { QuickActions } from '@/components/home/QuickActions';
import { StreakCard } from '@/components/home/StreakCard';
import { VitalsCards } from '@/components/home/VitalsCards';
import { WebPreviewNotice } from '@/components/home/WebPreviewNotice';
import { WorkoutSummaryCard } from '@/components/home/WorkoutSummaryCard';
import { Card } from '@/components/ui/Card';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/lib/tokens';
import { greetingForHour, relativeTime } from '@/lib/dates';
import { syncNow } from '@/services/sync';
import { firstNameOf, useProfileStore } from '@/stores/useProfileStore';
import { useHealthStore } from '@/stores/useHealthStore';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const name = useProfileStore((s) => s.name);
  const lastSynced = useHealthStore((s) => s.lastSynced);
  const syncing = useHealthStore((s) => s.syncing);
  const [permissionSheet, setPermissionSheet] = useState(false);
  const [callingSheet, setCallingSheet] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncNow();
    } finally {
      setRefreshing(false);
    }
  };

  const lastSyncedLabel = syncing
    ? 'Syncing…'
    : relativeTime(lastSynced ? new Date(lastSynced) : null);

  return (
    <Screen>
      <HomeHeader
        onSyncSpin={() => setSpinTrigger((n) => n + 1)}
        onShowPermissionSheet={() => setPermissionSheet(true)}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, gap: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.accent.steps}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, marginTop: 14, gap: 6 }}>
          <PText variant="display">
            Good {greetingForHour(new Date().getHours())}, {firstNameOf(name)}
          </PText>
          <PText variant="caption" tone="tertiary">
            Last synced {lastSyncedLabel}. Pull down to refresh.
          </PText>
          <DemoBadge />
        </View>

        <WebPreviewNotice />

        <PromoCarousel />

        <View style={{ paddingHorizontal: 20 }}>
          <QuickActions
            onShowPermissionSheet={() => setPermissionSheet(true)}
            onShowCallingSheet={() => setCallingSheet(true)}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <HealthOverviewCard spinTrigger={spinTrigger} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <StreakCard />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <VitalsCards />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <MetricDetailCards />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <WorkoutSummaryCard />
        </View>
      </ScrollView>

      {/* Start-workout FAB, floating above the tab bar */}
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          router.push('/record-workout');
        }}
        accessibilityRole="button"
        accessibilityLabel="Start a workout"
        style={{
          position: 'absolute',
          right: 20,
          bottom: Math.max(insets.bottom, 12) + 78,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent.steps,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.accent.steps,
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Plus size={26} color="#04150A" strokeWidth={2.2} />
      </Pressable>

      <PermissionSheet visible={permissionSheet} onClose={() => setPermissionSheet(false)} />

      {/* Calling stub sheet — honest about needing a watch */}
      {callingSheet ? (
        <Pressable
          onPress={() => setCallingSheet(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000AA',
            justifyContent: 'flex-end',
          }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Card style={{ margin: 16, marginBottom: Math.max(insets.bottom, 16), gap: 6 }}>
            <PText variant="h2">Calling</PText>
            <PText variant="caption" tone="secondary">
              Bluetooth calling needs a paired watch. Pulse runs watch-free, so this one stays a
              showcase — your phone already does the calling.
            </PText>
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}

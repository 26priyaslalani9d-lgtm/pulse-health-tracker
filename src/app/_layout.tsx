import '../global.css';

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/lib/tokens';
import { registerBackgroundRefresh } from '@/services/background';
import { hydrateFromCache, syncNow, currentStreak } from '@/services/sync';
import { rescheduleStreakAtRisk } from '@/services/notifications';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';

void SplashScreen.preventAutoHideAsync();

// Restore everything instantly from local cache before any health query runs.
hydrateFromCache();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const syncAndSchedule = async () => {
      await syncNow();
      const { today } = useHealthStore.getState();
      const goal = useGoalsStore.getState().steps;
      await rescheduleStreakAtRisk((today?.steps ?? 0) >= goal, currentStreak().current);
    };
    void syncAndSchedule();
    void registerBackgroundRefresh();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncAndSchedule();
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.top },
            animation: 'fade_from_bottom',
            animationDuration: 220,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="record-workout" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="standby" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

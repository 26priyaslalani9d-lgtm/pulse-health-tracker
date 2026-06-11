import { Redirect } from 'expo-router';
import Tabs from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useLivePedometer } from '@/lib/useLivePedometer';
import { useProfileStore } from '@/stores/useProfileStore';

export default function TabsLayout() {
  const onboarded = useProfileStore((s) => s.onboarded);
  useLivePedometer();

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#0A0A0B' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="challenges" options={{ title: 'Challenges' }} />
      <Tabs.Screen name="watchfaces" options={{ title: 'Watch faces' }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop' }} />
    </Tabs>
  );
}

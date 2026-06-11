import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/** Where each promo card navigates. Unknown ids are no-ops. */
export const PromoActions: Record<string, (router: Router) => void> = {
  'spotlight-standby': (router) => router.push('/(tabs)/watchfaces'),
  milestone: (router) => router.push('/steps'),
  'sleep-insight': (router) => router.push('/sleep'),
  'challenge-promo': (router) => router.push('/(tabs)/challenges'),
  'watchface-pack': (router) => router.push('/(tabs)/watchfaces'),
  'shop-drop': (router) => router.push('/(tabs)/shop'),
};

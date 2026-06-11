import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MessageSquare, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { DevPanel } from '@/components/DevPanel';
import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { syncNow } from '@/services/sync';
import { firstNameOf, useProfileStore } from '@/stores/useProfileStore';
import { useHealthStore } from '@/stores/useHealthStore';

interface HomeHeaderProps {
  onSyncSpin: () => void;
  onShowPermissionSheet: () => void;
}

/** Avatar + feedback / Gold orb / sync pill row. Triple-tap avatar = dev panel. */
export function HomeHeader({ onSyncSpin, onShowPermissionSheet }: HomeHeaderProps) {
  const router = useRouter();
  const name = useProfileStore((s) => s.name);
  const gold = useProfileStore((s) => s.gold);
  const permission = useHealthStore((s) => s.permission);
  const source = useHealthStore((s) => s.source);
  const [devVisible, setDevVisible] = useState(false);
  const taps = useRef<{ count: number; last: number }>({ count: 0, last: 0 });

  const onAvatarPress = () => {
    const now = Date.now();
    taps.current = {
      count: now - taps.current.last < 450 ? taps.current.count + 1 : 1,
      last: now,
    };
    if (taps.current.count >= 3) {
      taps.current.count = 0;
      setDevVisible(true);
      return;
    }
    // single tap (after the chord window) opens profile
    setTimeout(() => {
      if (taps.current.count === 1 && Date.now() - taps.current.last >= 450) {
        taps.current.count = 0;
        router.push('/profile');
      }
    }, 470);
  };

  const healthy = permission === 'granted' && source === 'real';
  const dotColor = healthy ? colors.accent.steps : colors.warning;

  const onSync = () => {
    void Haptics.selectionAsync();
    onSyncSpin();
    if (!healthy && source !== 'mock') onShowPermissionSheet();
    void syncNow();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
      }}
    >
      <Pressable
        onPress={onAvatarPress}
        accessibilityRole="button"
        accessibilityLabel="Profile. Triple tap for developer panel."
        style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.accent.streak,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PText variant="body" style={{ fontFamily: 'Inter_700Bold' }}>
            {(firstNameOf(name)[0] ?? 'P').toUpperCase()}
          </PText>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send feedback"
          style={roundBtn}
          onPress={() => {}}
        >
          <MessageSquare size={17} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={gold ? 'Pulse Gold active' : 'Get Pulse Gold'}
          style={roundBtn}
          onPress={() => {}}
        >
          <LinearGradient
            colors={[colors.gold.from, colors.gold.to]}
            style={{ width: 18, height: 18, borderRadius: 9, opacity: gold ? 1 : 0.55 }}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            healthy ? 'Health connected. Tap to sync now.' : 'Health connection needs attention. Tap to fix.'
          }
          onPress={onSync}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 13,
            minHeight: 36,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} />
          <RefreshCw size={14} color={colors.text.secondary} strokeWidth={1.75} />
          <PText variant="caption" tone="secondary">
            Sync
          </PText>
        </Pressable>
      </View>

      <DevPanel visible={devVisible} onClose={() => setDevVisible(false)} />
    </View>
  );
}

const roundBtn = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.card,
  borderColor: colors.cardBorder,
  borderWidth: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

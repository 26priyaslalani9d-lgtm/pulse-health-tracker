import { Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';

import { FACES } from '@/components/watchfaces/faces';
import { useLiveFaceData } from '@/components/watchfaces/useLiveFaceData';
import { PText } from '@/components/ui/PText';
import { useWatchfacesStore } from '@/stores/useWatchfacesStore';

/**
 * Standby Clock: the applied watchface as a full-screen always-on desk clock.
 * Kept awake while open — the honest native use for watchfaces with no watch.
 */
export default function StandbyScreen() {
  useKeepAwake();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const appliedFaceId = useWatchfacesStore((s) => s.appliedFaceId);
  const live = useLiveFaceData(1000);

  const face = FACES.find((f) => f.id === appliedFaceId) ?? FACES[0]!;
  const size = Math.min(width, height) * 0.86;

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Exit standby clock"
      style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
    >
      <face.Component size={size} {...live} />
      <View style={{ position: 'absolute', bottom: 40 }}>
        <PText variant="caption" tone="tertiary">
          Tap anywhere to exit · screen stays awake
        </PText>
      </View>
    </Pressable>
  );
}

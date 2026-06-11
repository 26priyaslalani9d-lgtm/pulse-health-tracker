import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Heart, Star, X } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { SnapCarousel } from '@/components/ui/SnapCarousel';
import {
  FACES,
  FACE_CATEGORIES,
  FACE_PACKS,
  type FaceDef,
  type FacePack,
} from '@/components/watchfaces/faces';
import { useLiveFaceData } from '@/components/watchfaces/useLiveFaceData';
import { colors } from '@/lib/tokens';
import { debug } from '@/lib/debug';
import { useWatchfacesStore } from '@/stores/useWatchfacesStore';

function FaceTile({ face, size, onPress }: { face: FaceDef; size: number; onPress: () => void }) {
  const live = useLiveFaceData(30_000);
  const favorites = useWatchfacesStore((s) => s.favorites);
  const toggleFavorite = useWatchfacesStore((s) => s.toggleFavorite);
  const isFav = favorites.includes(face.id);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${face.name} watchface, rated ${face.rating}`}
      style={{ width: size }}
    >
      <Card style={{ padding: 10, gap: 8 }}>
        <face.Component size={size - 22} {...live} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <PText variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {face.name}
            </PText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Star size={10} color={colors.accent.distance} strokeWidth={1.75} fill={colors.accent.distance} />
              <PText variant="caption" tone="tertiary">
                {face.rating.toFixed(1)}
              </PText>
            </View>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              toggleFavorite(face.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={isFav ? `Remove ${face.name} from favourites` : `Favourite ${face.name}`}
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Heart
              size={16}
              color={isFav ? colors.accent.heart : colors.text.tertiary}
              fill={isFav ? colors.accent.heart : 'transparent'}
              strokeWidth={1.75}
            />
          </Pressable>
        </View>
      </Card>
    </PressableScale>
  );
}

function FacePreviewModal({
  face,
  onClose,
}: {
  face: FaceDef | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const live = useLiveFaceData(1000);
  const applyFace = useWatchfacesStore((s) => s.applyFace);
  const favorites = useWatchfacesStore((s) => s.favorites);
  const toggleFavorite = useWatchfacesStore((s) => s.toggleFavorite);

  if (!face) return null;
  const isFav = favorites.includes(face.id);

  const onApply = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    applyFace(face.id);
    onClose();
    router.push('/standby');
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000D8', justifyContent: 'center', padding: 24 }}>
        <Card style={{ alignItems: 'center', gap: 16, paddingVertical: 24 }}>
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <PText variant="h2">{face.name}</PText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color={colors.text.secondary} strokeWidth={1.75} />
            </Pressable>
          </View>

          {/* watch bezel */}
          <View
            style={{
              padding: 12,
              borderRadius: 48,
              borderWidth: 6,
              borderColor: '#2A2A33',
              backgroundColor: '#000',
            }}
          >
            <face.Component size={200} {...live} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onApply}
              accessibilityRole="button"
              accessibilityLabel="Apply as standby clock"
              style={{
                backgroundColor: colors.accent.steps,
                borderRadius: 999,
                paddingHorizontal: 22,
                paddingVertical: 12,
                minHeight: 44,
              }}
            >
              <PText color="#04150A" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Apply
              </PText>
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(face.id)}
              accessibilityRole="button"
              accessibilityLabel={isFav ? 'Unfavourite' : 'Favourite'}
              style={bezelBtn}
            >
              <Heart
                size={18}
                color={isFav ? colors.accent.heart : colors.text.secondary}
                fill={isFav ? colors.accent.heart : 'transparent'}
                strokeWidth={1.75}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                Share.share({ message: `Check out the "${face.name}" watchface on Pulse` }).catch(
                  (e) => debug('share', 'face share failed', e),
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Share watchface"
              style={bezelBtn}
            >
              <PText tone="secondary">Share</PText>
            </Pressable>
          </View>
          <PText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
            Apply turns this face into your Standby Clock — a live desk clock with your real
            stats. No watch needed.
          </PText>
        </Card>
      </View>
    </Modal>
  );
}

const bezelBtn = {
  borderRadius: 999,
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  backgroundColor: colors.card,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: 44,
};

function PackCard({ pack, width, onExplore }: { pack: FacePack; width: number; onExplore: () => void }) {
  const live = useLiveFaceData(30_000);
  const packFaces = FACES.filter((f) => pack.faceIds.includes(f.id)).slice(0, 3);
  return (
    <View
      style={{
        width,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      <LinearGradient
        colors={[`${pack.tint}30`, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16, gap: 12 }}
      >
        <PText variant="h2">{pack.name}</PText>
        <PText variant="caption" tone="secondary">
          {pack.tagline}
        </PText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {packFaces.map((f) => (
            <f.Component key={f.id} size={(width - 64) / 3} {...live} />
          ))}
        </View>
        <Pressable
          onPress={onExplore}
          accessibilityRole="button"
          accessibilityLabel={`Explore ${pack.name} pack`}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: pack.tint,
            borderRadius: 999,
            paddingHorizontal: 18,
            paddingVertical: 9,
            minHeight: 38,
          }}
        >
          <PText variant="caption" color="#0A0A0B" style={{ fontFamily: 'Inter_600SemiBold' }}>
            Explore Now
          </PText>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

export default function WatchfacesScreen() {
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<string>('All');
  const [preview, setPreview] = useState<FaceDef | null>(null);
  const favorites = useWatchfacesStore((s) => s.favorites);

  const tileWidth = (width - 20 * 2 - 12) / 2;
  const packWidth = width - 64;

  const visibleFaces = useMemo(() => {
    if (category === 'All') return FACES;
    if (category === 'Your collection') return FACES.filter((f) => favorites.includes(f.id));
    return FACES.filter((f) => f.category === category);
  }, [category, favorites]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, gap: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <PText variant="display">Watch faces</PText>
          <PText variant="caption" tone="tertiary" style={{ marginTop: 4 }}>
            Live previews — every face shows your real time, steps, kcal and BPM.
          </PText>
        </View>

        <SnapCarousel
          data={FACE_PACKS}
          itemWidth={packWidth}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PackCard pack={item} width={packWidth} onExplore={() => setCategory('All')} />
          )}
        />

        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 2, justifyContent: 'space-between', gap: 8 }}>
            <PText variant="h2">Create your own watchfaces!</PText>
            <PText variant="caption" tone="secondary">
              Mix complications, colours and hands.
            </PText>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.accent.streak,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <PText variant="caption" color="#120A1F" style={{ fontFamily: 'Inter_600SemiBold' }}>
                Get Started
              </PText>
            </View>
          </Card>
          <PressableScale
            style={{ flex: 1 }}
            onPress={() => setCategory('Your collection')}
            accessibilityRole="button"
            accessibilityLabel="Your collection"
          >
            <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Heart size={20} color={colors.accent.heart} strokeWidth={1.75} />
              <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                Your collection ({favorites.length})
              </PText>
            </Card>
          </PressableScale>
        </View>

        <CategoryTabs
          categories={[...FACE_CATEGORIES]}
          selected={category === 'Your collection' ? 'All' : category}
          onSelect={setCategory}
          accent={colors.accent.streak}
        />

        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {visibleFaces.map((face) => (
            <FaceTile key={face.id} face={face} size={tileWidth} onPress={() => setPreview(face)} />
          ))}
        </View>
      </ScrollView>

      <FacePreviewModal face={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}

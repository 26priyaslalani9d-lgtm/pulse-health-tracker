import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check, Heart, Star, X } from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/lib/tokens';
import { PRODUCT_CATEGORIES, PRODUCTS, type Product } from '@/mocks/products';
import { useShopStore } from '@/stores/useShopStore';

/** Abstract product art — SVG only, no stock photos. */
function ProductArt({ tint, size }: { tint: string; size: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 100 60">
      <Rect width="100" height="60" rx="10" fill={`${tint}18`} />
      <Circle cx="30" cy="30" r="16" fill={tint} opacity={0.5} />
      <Rect x="52" y="16" width="36" height="8" rx="4" fill={tint} opacity={0.7} />
      <Rect x="52" y="30" width="26" height="8" rx="4" fill={tint} opacity={0.4} />
      <Rect x="52" y="44" width="18" height="4" rx="2" fill={tint} opacity={0.3} />
    </Svg>
  );
}

function ProductDetailModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'detail' | 'confirmed'>('detail');
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);

  if (!product) return null;
  const wished = wishlist.includes(product.id);

  const close = () => {
    setStage('detail');
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: '#000000C8', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg.bottom,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 40,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PText variant="h2">{stage === 'confirmed' ? 'Order placed' : product.name}</PText>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color={colors.text.secondary} strokeWidth={1.75} />
            </Pressable>
          </View>

          {stage === 'detail' ? (
            <>
              <ProductArt tint={product.tint} size={320} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Star size={14} color={colors.accent.distance} fill={colors.accent.distance} strokeWidth={1.75} />
                <PText variant="caption" tone="secondary">
                  {product.rating.toFixed(1)} · {product.category}
                </PText>
              </View>
              <PText variant="body" tone="secondary">
                {product.blurb}
              </PText>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <PText variant="display" color={product.tint}>
                  ${product.price.toFixed(2)}
                </PText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={() => toggleWishlist(product.id)}
                    accessibilityRole="button"
                    accessibilityLabel={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Heart
                      size={18}
                      color={wished ? colors.accent.heart : colors.text.secondary}
                      fill={wished ? colors.accent.heart : 'transparent'}
                      strokeWidth={1.75}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setStage('confirmed');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Buy ${product.name}`}
                    style={{
                      backgroundColor: product.tint,
                      borderRadius: 999,
                      paddingHorizontal: 26,
                      justifyContent: 'center',
                      minHeight: 48,
                    }}
                  >
                    <PText color="#0A0A0B" style={{ fontFamily: 'Inter_600SemiBold' }}>
                      Buy now
                    </PText>
                  </Pressable>
                </View>
              </View>
              <PText variant="caption" tone="tertiary">
                Demo checkout — no payment is processed.
              </PText>
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: `${colors.accent.steps}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={30} color={colors.accent.steps} strokeWidth={2} />
              </View>
              <PText variant="h2">Thanks!</PText>
              <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                Your (pretend) {product.name} is on its (pretend) way. This shop is a catalog
                stub — nothing was charged.
              </PText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<string>('All');
  const [selected, setSelected] = useState<Product | null>(null);
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);

  const tileWidth = (width - 20 * 2 - 12) / 2;
  const featured = PRODUCTS[5]!;

  const visible = useMemo(
    () => (category === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.category === category)),
    [category],
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, gap: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <PText variant="display">Shop</PText>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <PressableScale
            onPress={() => setSelected(featured)}
            accessibilityRole="button"
            accessibilityLabel={`Featured: ${featured.name}`}
          >
            <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.cardBorder }}>
              <LinearGradient
                colors={[`${featured.tint}30`, colors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, gap: 8 }}
              >
                <PText variant="caption" color={featured.tint}>
                  Featured
                </PText>
                <PText variant="h2">{featured.name}</PText>
                <PText variant="caption" tone="secondary">
                  {featured.blurb}
                </PText>
                <PText variant="number" color={featured.tint}>
                  ${featured.price.toFixed(2)}
                </PText>
              </LinearGradient>
            </View>
          </PressableScale>
        </View>

        <CategoryTabs
          categories={[...PRODUCT_CATEGORIES]}
          selected={category}
          onSelect={setCategory}
          accent={colors.accent.distance}
        />

        {visible.length === 0 ? (
          <EmptyState icon={Heart} title="Nothing here" body="Try another category." />
        ) : (
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {visible.map((product) => {
              const wished = wishlist.includes(product.id);
              return (
                <PressableScale
                  key={product.id}
                  style={{ width: tileWidth }}
                  onPress={() => setSelected(product)}
                  accessibilityRole="button"
                  accessibilityLabel={`${product.name}, $${product.price.toFixed(2)}`}
                >
                  <Card style={{ padding: 12, gap: 8 }}>
                    <ProductArt tint={product.tint} size={tileWidth - 24} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <PText variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
                          {product.name}
                        </PText>
                        <PText variant="caption" tone="tertiary">
                          ${product.price.toFixed(2)}
                        </PText>
                      </View>
                      <Pressable
                        onPress={() => toggleWishlist(product.id)}
                        accessibilityRole="button"
                        accessibilityLabel={wished ? `Remove ${product.name} from wishlist` : `Wishlist ${product.name}`}
                        style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Heart
                          size={15}
                          color={wished ? colors.accent.heart : colors.text.tertiary}
                          fill={wished ? colors.accent.heart : 'transparent'}
                          strokeWidth={1.75}
                        />
                      </Pressable>
                    </View>
                  </Card>
                </PressableScale>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

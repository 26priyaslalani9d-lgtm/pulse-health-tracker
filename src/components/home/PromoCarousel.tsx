import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { PromoActions } from './promoActions';
import { PText } from '@/components/ui/PText';
import { PressableScale } from '@/components/ui/PressableScale';
import { SnapCarousel } from '@/components/ui/SnapCarousel';
import { colors } from '@/lib/tokens';
import { PROMOS, type Promo } from '@/mocks/promos';

/** Swipeable promo carousel with dots + n/9 counter. */
export function PromoCarousel() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const itemWidth = width - 56;

  const renderPromo = ({ item }: { item: Promo }) => {
    const isGold = item.kind === 'gold';
    return (
      <PressableScale
        onPress={() => PromoActions[item.id]?.(router)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.body}`}
        style={{ width: itemWidth }}
      >
        <View
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isGold ? colors.gold.from : colors.cardBorder,
          }}
        >
          <LinearGradient
            colors={[`${item.tint}30`, colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, minHeight: 104, justifyContent: 'space-between' }}
          >
            <View>
              <PText variant="h2" color={isGold ? colors.gold.from : colors.text.primary}>
                {item.title}
              </PText>
              <PText variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                {item.body}
              </PText>
            </View>
            <PText variant="caption" color={item.tint} style={{ fontFamily: 'Inter_600SemiBold', marginTop: 10 }}>
              {item.cta} →
            </PText>
          </LinearGradient>
        </View>
      </PressableScale>
    );
  };

  return (
    <SnapCarousel
      data={PROMOS}
      renderItem={renderPromo}
      itemWidth={itemWidth}
      keyExtractor={(p) => p.id}
    />
  );
}

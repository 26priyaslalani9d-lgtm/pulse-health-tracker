import { useRef, useState } from 'react';
import {
  FlatList,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface SnapCarouselProps<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  itemWidth: number;
  gap?: number;
  /** show "n/total" counter chip */
  counter?: boolean;
  keyExtractor: (item: T) => string;
  sidePadding?: number;
}

/** Swipeable snap carousel with dots and an n/total counter. */
export function SnapCarousel<T>({
  data,
  renderItem,
  itemWidth,
  gap = 12,
  counter = true,
  keyExtractor,
  sidePadding = 20,
}: SnapCarouselProps<T>) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<T>>(null);
  const interval = itemWidth + gap;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / interval);
    if (i !== index && i >= 0 && i < data.length) setIndex(i);
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        horizontal
        data={data as T[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
        onScroll={onScroll}
        scrollEventThrottle={32}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 10,
          gap: 5,
        }}
      >
        {data.map((item, i) => (
          <View
            key={keyExtractor(item)}
            style={{
              width: i === index ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === index ? colors.text.primary : colors.text.tertiary,
            }}
          />
        ))}
        {counter ? (
          <View
            style={{
              marginLeft: 8,
              backgroundColor: colors.card,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <PText variant="caption" tone="secondary">{`${index + 1}/${data.length}`}</PText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

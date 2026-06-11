import { Pressable, ScrollView } from 'react-native';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface CategoryTabsProps {
  categories: readonly string[];
  selected: string;
  onSelect: (category: string) => void;
  accent?: string;
}

/** Horizontally scrollable category chips. */
export function CategoryTabs({ categories, selected, onSelect, accent = colors.accent.steps }: CategoryTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {categories.map((cat) => {
        const active = cat === selected;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={cat}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: 999,
              minHeight: 38,
              backgroundColor: active ? `${accent}26` : colors.card,
              borderWidth: 1,
              borderColor: active ? accent : colors.cardBorder,
            }}
          >
            <PText variant="caption" color={active ? accent : colors.text.secondary}>
              {cat}
            </PText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

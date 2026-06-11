import { View } from 'react-native';
import { FlaskConical } from 'lucide-react-native';

import { PText } from '@/components/ui/PText';
import { colors } from '@/lib/tokens';
import { useHealthStore } from '@/stores/useHealthStore';

/** Always-visible badge whenever the mock engine is the data source. */
export function DemoBadge() {
  const source = useHealthStore((s) => s.source);
  if (source !== 'mock') return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: `${colors.warning}22`,
        borderColor: `${colors.warning}66`,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
      accessibilityLabel="Showing demo data, not real health data"
    >
      <FlaskConical size={12} color={colors.warning} strokeWidth={1.75} />
      <PText variant="caption" color={colors.warning}>
        demo data
      </PText>
    </View>
  );
}

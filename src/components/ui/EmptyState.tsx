import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/lib/tokens';
import { PText } from './PText';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}

/** Designed empty/error state — the brief bans skipped empty states. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 8 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Icon size={26} color={colors.text.secondary} strokeWidth={1.75} />
      </View>
      <PText variant="h2">{title}</PText>
      <PText variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
        {body}
      </PText>
      {action}
    </View>
  );
}

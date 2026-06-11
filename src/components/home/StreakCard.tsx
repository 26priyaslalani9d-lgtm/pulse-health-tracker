import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Trophy } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { GoldPill } from '@/components/ui/GoldPill';
import { PText } from '@/components/ui/PText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/lib/tokens';
import { computeStreak, STREAK_TIERS } from '@/lib/streak';
import { useGoalsStore } from '@/stores/useGoalsStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useProfileStore } from '@/stores/useProfileStore';

/** Daily step streak: purple league badge, milestone bubbles 1x→5x, gold upsell. */
export function StreakCard() {
  const history = useHealthStore((s) => s.history);
  const stepGoal = useGoalsStore((s) => s.steps);
  const streakTarget = useGoalsStore((s) => s.streakTargetDays);
  const gold = useProfileStore((s) => s.gold);
  const streak = computeStreak(history, stepGoal);
  const lastCelebrated = useRef(0);

  // Streak milestone: success haptic when a tier is newly reached.
  useEffect(() => {
    if (streak.tier > 0 && streak.tier > lastCelebrated.current) {
      lastCelebrated.current = streak.tier;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [streak.tier]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: `${colors.accent.streak}26`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trophy size={22} color={colors.accent.streak} strokeWidth={1.75} />
        </View>
        <View style={{ flex: 1 }}>
          <PText variant="h2">Daily step streak</PText>
          <PText variant="caption" tone="secondary">
            {streak.current} of {streakTarget} days
          </PText>
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <ProgressBar
          progress={streak.current / Math.max(streakTarget, 1)}
          color={colors.accent.streak}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        {STREAK_TIERS.map((threshold, i) => {
          const reached = streak.current >= threshold;
          const isCurrent = streak.tier === i; // the tier being chased glows
          return (
            <View key={threshold} style={{ alignItems: 'center', gap: 3 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: reached ? colors.accent.streak : colors.bg.bottom,
                  borderWidth: 1.5,
                  borderColor: isCurrent ? colors.accent.streak : colors.cardBorder,
                  shadowColor: isCurrent ? colors.accent.streak : 'transparent',
                  shadowOpacity: isCurrent ? 0.9 : 0,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: isCurrent ? 6 : 0,
                }}
              >
                <PText
                  variant="caption"
                  color={reached ? '#120A1F' : colors.text.secondary}
                  style={{ fontFamily: 'Inter_700Bold' }}
                >
                  {i + 1}x
                </PText>
              </View>
              <PText variant="caption" tone="tertiary">
                {threshold}d
              </PText>
            </View>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
        }}
      >
        <PText variant="caption" tone="secondary" style={{ flex: 1, marginRight: 10 }}>
          {streak.todayMet
            ? 'Today counts — keep it rolling.'
            : streak.daysToNextTier > 0
              ? `${streak.daysToNextTier} more days to the next league.`
              : 'Top league. Defend it daily.'}
        </PText>
        {!gold ? <GoldPill label="Unlock gold" /> : null}
      </View>
    </Card>
  );
}

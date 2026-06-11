import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CalendarDays, Medal, Trophy, X } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldPill } from '@/components/ui/GoldPill';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PText } from '@/components/ui/PText';
import { Screen } from '@/components/ui/Screen';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { ChallengeArt } from '@/components/challenges/ChallengeArt';
import { colors } from '@/lib/tokens';
import { monthDayLabel } from '@/lib/dates';
import {
  ALL_CHALLENGES,
  challengeStatus,
  daysUntil,
  formatTarget,
  metricLabel,
  type ChallengeDef,
} from '@/mocks/challenges';
import { updateChallengeProgress } from '@/services/sync';
import { useChallengesStore } from '@/stores/useChallengesStore';

const AVATAR_TINTS = ['#8B5CF6', '#34D26A', '#F5C518', '#FF4D4D'];

function OverlappingAvatars({ top, count }: { top: string; count: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row' }}>
        {AVATAR_TINTS.map((tint, i) => (
          <View
            key={tint}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: tint,
              marginLeft: i === 0 ? 0 : -8,
              borderWidth: 1.5,
              borderColor: colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityElementsHidden
          >
            <PText variant="caption" color="#0A0A0B" style={{ fontSize: 10, lineHeight: 12 }}>
              {String.fromCharCode(65 + i)}
            </PText>
          </View>
        ))}
      </View>
      <PText variant="caption" tone="secondary" style={{ marginLeft: 8 }}>
        {top} and {count.toLocaleString()} others
      </PText>
    </View>
  );
}

function ChallengeCard({ challenge }: { challenge: ChallengeDef }) {
  const joined = useChallengesStore((s) => s.joined[challenge.id]);
  const join = useChallengesStore((s) => s.join);
  const leave = useChallengesStore((s) => s.leave);
  const status = challengeStatus(challenge);

  const progressFraction = joined ? Math.min(1, joined.progress / challenge.target) : 0;
  const progressText =
    challenge.metric === 'distance'
      ? `${(joined?.progress ?? 0).toFixed(1)} / ${challenge.target} km`
      : `${Math.round(joined?.progress ?? 0).toLocaleString()} / ${challenge.target.toLocaleString()}`;

  const onToggle = () => {
    void Haptics.selectionAsync();
    if (joined) {
      leave(challenge.id);
    } else {
      join(challenge.id);
      updateChallengeProgress();
    }
  };

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <View style={{ height: 110 }}>
        <ChallengeArt kind={challenge.art} tint={challenge.tint} />
        {status === 'upcoming' ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: '#0A0A0BD0',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <PText variant="caption" color={challenge.tint}>
              Upcoming
            </PText>
          </View>
        ) : null}
        {joined?.completed ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: '#0A0A0BD0',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Medal size={12} color={colors.gold.from} strokeWidth={1.75} />
            <PText variant="caption" color={colors.gold.from}>
              Badge earned
            </PText>
          </View>
        ) : null}
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <PText variant="caption" tone="tertiary">
          {status === 'upcoming'
            ? `Starts in ${daysUntil(challenge.start)} days · ${metricLabel(challenge.metric)}`
            : status === 'active'
              ? `Ends in ${daysUntil(challenge.end)} days · ${metricLabel(challenge.metric)}`
              : `Ended ${monthDayLabel(challenge.end)} · ${metricLabel(challenge.metric)}`}
        </PText>
        <PText variant="h2">{challenge.title}</PText>
        <PText variant="caption" tone="secondary">
          Target: {formatTarget(challenge)}
        </PText>
        <OverlappingAvatars top={challenge.topParticipant} count={challenge.participants} />

        {joined ? (
          <View style={{ gap: 6 }}>
            <ProgressBar progress={progressFraction} color={challenge.tint} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <PText variant="caption" tone="secondary">
                {progressText}
              </PText>
              <PText variant="caption" color={challenge.tint}>
                {Math.round(progressFraction * 100)}%
              </PText>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={joined ? `Leave ${challenge.title}` : `Join ${challenge.title}`}
          style={{
            borderRadius: 999,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: joined ? colors.card : challenge.tint,
            borderWidth: 1,
            borderColor: joined ? colors.cardBorder : challenge.tint,
            minHeight: 44,
          }}
        >
          <PText
            variant="body"
            color={joined ? colors.text.secondary : '#0A0A0B'}
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            {joined ? (joined.completed ? 'Completed · Leave' : 'Joined · Leave') : 'Join challenge'}
          </PText>
        </Pressable>
      </View>
    </Card>
  );
}

function ChallengeCalendar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayTints = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of ALL_CHALLENGES) {
      let cursor = new Date(Math.max(c.start.getTime(), new Date(year, month, 1).getTime()));
      const end = new Date(Math.min(c.end.getTime(), new Date(year, month, daysInMonth).getTime()));
      while (cursor <= end) {
        if (cursor.getMonth() === month && !map.has(cursor.getDate())) {
          map.set(cursor.getDate(), c.tint);
        }
        cursor = new Date(cursor.getTime() + 24 * 3_600_000);
      }
    }
    return map;
  }, [year, month, daysInMonth]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000C8',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <PText variant="h2">
              {now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </PText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close calendar"
              style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} color={colors.text.secondary} strokeWidth={1.75} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={`${d}${i}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 }}>
                <PText variant="caption" tone="tertiary">
                  {d}
                </PText>
              </View>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`pad-${i}`} style={{ width: `${100 / 7}%` }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const tint = dayTints.get(day);
              const isToday = day === now.getDate();
              return (
                <View key={day} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 5 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: tint ? `${tint}30` : 'transparent',
                      borderWidth: isToday ? 1.5 : 0,
                      borderColor: colors.text.primary,
                    }}
                  >
                    <PText variant="caption" tone={tint ? 'primary' : 'tertiary'}>
                      {day}
                    </PText>
                  </View>
                </View>
              );
            })}
          </View>
          <PText variant="caption" tone="tertiary">
            Tinted days have a challenge running.
          </PText>
        </Card>
      </View>
    </Modal>
  );
}

export default function ChallengesScreen() {
  const [tab, setTab] = useState(0);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const joinedMap = useChallengesStore((s) => s.joined);

  const challenges = useMemo(() => {
    if (tab === 0) return ALL_CHALLENGES.filter((c) => !joinedMap[c.id]);
    return ALL_CHALLENGES.filter((c) => joinedMap[c.id]);
  }, [tab, joinedMap]);

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 8,
        }}
      >
        <PText variant="display">Challenges</PText>
        <Pressable
          onPress={() => setCalendarVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Challenge calendar"
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <CalendarDays size={22} color={colors.text.secondary} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <SegmentedTabs tabs={['New', 'Joined']} selected={tab} onSelect={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 130, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.gold.from }}>
          <LinearGradient
            colors={[`${colors.gold.from}28`, colors.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ flex: 1 }}>
              <PText variant="h2" color={colors.gold.from}>
                Create your own challenges
              </PText>
              <PText variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                Set the metric, invite friends, pick the window. A Gold thing.
              </PText>
            </View>
            <GoldPill label="Get Gold" />
          </LinearGradient>
        </View>

        {challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={tab === 1 ? 'Nothing joined yet' : 'All joined!'}
            body={
              tab === 1
                ? 'Join a challenge from the New tab — your real steps, distance and calories count toward it.'
                : 'You joined every open challenge. New ones land weekly.'
            }
          />
        ) : (
          challenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)
        )}
      </ScrollView>

      <ChallengeCalendar visible={calendarVisible} onClose={() => setCalendarVisible(false)} />
    </Screen>
  );
}

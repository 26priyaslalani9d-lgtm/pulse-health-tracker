/** Promo carousel content (local mock data). */

export interface Promo {
  id: string;
  kind: 'gold' | 'referral' | 'product' | 'milestone' | 'insight';
  title: string;
  body: string;
  cta: string;
  tint: string;
}

export const PROMOS: Promo[] = [
  {
    id: 'gold-upsell',
    kind: 'gold',
    title: 'Pulse Gold — 10% off',
    body: 'Streak freezes, custom challenges and gold watchfaces.',
    cta: 'Upgrade',
    tint: '#E8C46A',
  },
  {
    id: 'referral',
    kind: 'referral',
    title: 'Walk with friends',
    body: 'Invite a friend and you both earn a streak freeze.',
    cta: 'Invite',
    tint: '#34D26A',
  },
  {
    id: 'spotlight-standby',
    kind: 'product',
    title: 'Standby Clock',
    body: 'Turn any watchface into a desk clock that shows live stats.',
    cta: 'Try it',
    tint: '#5EA0EF',
  },
  {
    id: 'milestone',
    kind: 'milestone',
    title: 'Milestone badges',
    body: 'Hit 7 goal days in a row to earn the 2x league badge.',
    cta: 'View streak',
    tint: '#8B5CF6',
  },
  {
    id: 'sleep-insight',
    kind: 'insight',
    title: 'Sleep insight',
    body: 'Consistent bedtimes lift deep-sleep share. See your trend.',
    cta: 'Open sleep',
    tint: '#FF3B7A',
  },
  {
    id: 'challenge-promo',
    kind: 'product',
    title: 'New challenges weekly',
    body: 'Join the community and race real step data, not bots.',
    cta: 'Browse',
    tint: '#F5C518',
  },
  {
    id: 'watchface-pack',
    kind: 'product',
    title: 'Space pack is live',
    body: 'Five new galaxy faces with live step complications.',
    cta: 'Explore',
    tint: '#4DD0E1',
  },
  {
    id: 'privacy',
    kind: 'insight',
    title: 'Private by design',
    body: 'Health data never leaves this device. No accounts, no ads.',
    cta: 'Learn more',
    tint: '#34D26A',
  },
  {
    id: 'shop-drop',
    kind: 'product',
    title: 'Gear drop',
    body: 'Bands, chargers and running gear in the shop.',
    cta: 'Shop',
    tint: '#FF4D4D',
  },
];

# Pulse — native fitness tracker

A production-quality, native iOS/Android fitness tracking app. Dark, premium, tri-ring
health dashboard in the spirit of the NoiseFit companion app — but with **no watch**:
the data source is the phone itself, read from **Apple HealthKit** on iOS and
**Health Connect** on Android. The phone OS counts steps 24/7 in the background;
Pulse reads that data and presents it beautifully.

> **Privacy promise:** Pulse is single-user and local-first. There is no login, no
> analytics, no ads, no third-party trackers, and no server. Health data never leaves
> the device. The only way data exits the app is when *you* tap Share or Export.

The legacy web PWA that previously lived in this repository is preserved under
[`legacy-pwa/`](legacy-pwa/).

---

## Install on your iPhone

This app uses native health modules, so it **cannot run in Expo Go**. You need a
development build with `expo-dev-client` (already configured).

### Option A — with a Mac (fastest)

```bash
npm install
npx expo run:ios --device        # pick your iPhone from the list
```

Requirements: Xcode installed, your iPhone in developer mode, and an Apple ID added
in Xcode (Settings → Accounts). With a **free** Apple ID the app signature expires
after **7 days** — just run the command again to re-sign. A paid developer account
removes that limit.

### Option B — without a Mac (EAS Build)

```bash
npm install
npm install -g eas-cli
eas login                        # free Expo account
eas build --profile development --platform ios
```

EAS will walk you through registering your iPhone (it generates an ad-hoc
provisioning profile — an **Apple ID is required**, and Apple's free-account 7-day
signing limit applies here too). When the build finishes, open the link on your
phone and install. Then start the dev server on any machine:

```bash
npx expo start --dev-client
```

### iOS Simulator

```bash
npx expo run:ios
```

HealthKit returns nothing on the Simulator. Pulse detects this and switches to the
**mock data engine** automatically, with a visible **“demo data”** badge in the
header so you always know which mode you're in.

### Android

```bash
npx expo run:android
```

Health Connect support is architected in from day one behind the same
`HealthService` interface (see below). Status: implemented and typed end-to-end
(steps, distance, calories, HR, SpO₂, sleep sessions with stages, exercise
sessions, workout writes), but it intentionally lags iOS slightly in polish per
the brief — e.g. per-session energy attribution is not aggregated from separate
calorie records yet. If Health Connect isn't installed, Pulse shows a designed
fix-it card that deep-links to the Play Store.

---

## The acceptance test

Install the dev build, grant Health access, and:

- your real step count appears and the rings animate to it (1.2 s ease-out fill,
  staggered, with synced count-up numbers);
- walk around the room — the live pedometer ticker climbs between HealthKit
  refreshes (HealthKit total wins on every reconcile);
- pull to refresh — “Last synced” says *Just now*;
- last night's sleep shows with Awake/REM/Light/Deep stages;
- record a 2-minute walking workout in-app — it appears in Pulse history **and**
  in the Apple Health app;
- your streak reflects your actual past week (a day counts when steps ≥ goal);
- kill and reopen the app — everything restores instantly from the SQLite cache
  before refreshing in the background.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React Native via **Expo SDK 56**, TypeScript strict, **Expo Router** |
| Build | `expo-dev-client` + EAS (`eas.json`: `development`, `development-simulator`, `preview`, `production`) |
| Health (iOS) | `@kingstinct/react-native-healthkit` |
| Health (Android) | `react-native-health-connect` |
| Live steps | `expo-sensors` Pedometer (foreground ticker) |
| Styling | **NativeWind v4** + token file (`src/lib/tokens.ts`) — no UI kit |
| Animation | `react-native-reanimated` + `react-native-svg` (rings, tab pill, watchfaces) |
| Charts | `victory-native` (XL, Skia) for bar/line charts in detail screens |
| State | **Zustand** + `persist` on **MMKV** (`react-native-mmkv`) — not AsyncStorage |
| Time series | **expo-sqlite** cache of daily/hourly aggregates for instant offline charts |
| Fonts | Inter (UI) + Space Grotesk (big numerals) via `expo-font` |
| Notifications | `expo-notifications` (local only) |
| Haptics | `expo-haptics` on milestones, tab changes, goal completion |

### Why `@kingstinct/react-native-healthkit` (not `react-native-health`)

- Actively maintained with first-class **New Architecture / Nitro modules** support;
  `react-native-health` has long-standing unmaintained-status issues and a legacy
  bridge design.
- Fully typed API (typed quantity identifiers, typed units) — fits the strict-TS,
  no-`any` bar of this codebase.
- Ships a config plugin that injects the HealthKit entitlement + usage strings at
  prebuild, which is exactly how an Expo dev-client project should be wired.

---

## Architecture

### The HealthService abstraction (the only place health libs exist)

```
src/services/health/
├── HealthService.ts          # platform-neutral entry; TS/web fallback → mock
├── HealthService.ios.ts      # HealthKit implementation
├── HealthService.android.ts  # Health Connect implementation
├── MockHealthService.ts      # seeded realistic generator (fallback only)
└── index.ts                  # real-vs-mock resolution + demo-mode signal
```

One interface (`src/types/health.ts`): `getTodaySnapshot()`, `getDailyMetrics(range)`,
`getHourlySteps(range)`, `getHeartRateSamples(range)`, `getOxygenSamples(range)`,
`getSleepSessions(range)`, `getWorkouts(range)`, `saveWorkout(draft)`,
`observeTodaySteps(cb)`, `requestPermissions()`, `getPermissionState()`,
`isAvailable()`. **UI code never imports a health library directly** — Metro picks
the `.ios.ts`/`.android.ts` file at build time, and `resolveHealthSource()` swaps in
the mock when the store is unavailable or permission is denied.

Workouts are a **discriminated union** (`DistanceWorkout | StationaryWorkout`) keyed
on `type`, so distance/steps fields only exist where they make sense.

### Data flow

1. **Cold start:** `hydrateFromCache()` reads SQLite synchronously → charts render
   instantly offline. Then a background `syncNow()` reconciles with the platform.
2. **Foreground:** the Pedometer adds live deltas to the displayed step count
   between refreshes. On every sync the baseline folds in — **HealthKit totals
   always win**, steps are never double-counted (`src/lib/useLivePedometer.ts`).
3. **Pull-to-refresh:** re-queries and sets “Last synced: Just now”.
4. **Backfill:** on first permission grant (onboarding step 4), 90 days of daily
   aggregates + 14 days of hourly steps are pulled into SQLite with a progress ring.
5. **Workout recording:** timer, pause/resume, live steps, MET-based calorie
   estimate from your weight → on finish the workout is **written back to
   HealthKit/Health Connect** and kept locally (merged + de-duplicated in the UI).
6. **Derived metrics:** HealthKit's own distance/calories are preferred; stride ×
   steps (stride from your height) is used only where the OS gives nothing
   (e.g. live distance during an in-app walk).

### Storage schema

- **SQLite** (`pulse.db`):
  - `daily_metrics(date TEXT PK, steps INT, distance_km REAL, calories REAL)`
  - `hourly_steps(date TEXT, hour INT, steps INT, PK(date, hour))`
- **MMKV** (via Zustand `persist`): profile, goals, settings/dev flags, recorded
  workouts (with sparse HR curves), challenge joins/progress/badges, watchface
  favourites + applied face, shop wishlist, stress check-ins, last-synced stamp.

### Streak logic

`src/lib/streak.ts` — computed from **real history**: a day counts when
`steps ≥ goal`. An unfinished *today* never breaks the streak (it counts once the
goal is met). Milestone tiers (1x→5x bubbles) at 3/7/14/30/60 days. Editing a goal
re-evaluates **going forward only** — history is never rewritten. Streak-freeze
tokens exist as a Gold concept in the UI.

### Background refresh & the 8 PM reminder (honest iOS note)

`expo-background-task` registers a periodic refresh, **but iOS decides when (and
whether) background tasks run** — they can be deferred for hours or skipped
entirely. The “streak at risk” reminder therefore does **not** rely on it: it's a
**scheduled local notification** whose content is computed at schedule time (on
every app open/sync) and corrected on the next open. If the goal is met during the
day, the pending notification is cancelled on the next sync. This is the honest
best-effort iOS allows.

### Permission UX

The OS permission sheet is never fired cold. Onboarding step 4 explains *why* with
an illustration, then one “Connect Apple Health” button triggers the request. Every
state is a designed screen, not an alert: granted, **partially granted** (HealthKit
allows per-type), denied (fix-permissions sheet with a `Linking.openSettings()`
deep-link card), and unavailable (Simulator → demo mode; Android without Health
Connect → Play Store prompt). Note: HealthKit deliberately hides per-type **read**
denial from apps — Pulse reports the most honest state it can derive and says so
in the UI copy.

### Mock data engine & dev panel

`MockHealthService.ts` implements the same interface with a deterministic, seeded
30-day generator: hourly steps peaking ~8 am/1 pm/7 pm, HR 60–155 by context,
nightly sleep with stage cycles, workouts on a profile-dependent cadence. Used
automatically on the Simulator or when permission is denied — always with the
“demo data” badge visible.

**Hidden dev panel:** triple-tap the avatar. Switch real/mock, reseed
(`sedentary | active | athlete`), time-skip ±N days for streak testing, toggle
Gold, wipe storage.

---

## Screens

- **Home** — header (avatar / feedback / Gold orb / sync pill with connection dot +
  360° ring-spin on sync), greeting with relative “last synced”, real
  pull-to-refresh, promo snap-carousel (n/9 counter), 4-up quick actions, the
  **health overview hero** (steps/distance/calories column + ~140 px tri-ring,
  shareable as a PNG via `react-native-view-shot`), streak card with glowing
  milestone bubbles, heart-rate / sleep / SpO₂ / stress cards, metric detail cards,
  workout summary, start-workout FAB.
- **Detail screens** — `/steps`, `/distance`, `/calories` (hero goal ring, 7-day
  bars with today highlighted, hourly mini-chart, **long-press goal editor**),
  `/heart-rate` (Day/Week/Month, line chart with Resting/Fat-burn/Cardio/Peak zone
  bands, min/avg/max chips), `/sleep` (stage timeline, duration breakdown, 0–100
  sleep score, 7-night trend), `/spo2` (readings + trend), `/stress` (manual 0–100
  check-in — **iOS has no stress API and the UI says so**), `/workouts` +
  `/workouts/[id]` (filterable list; detail with stats, HR curve during the
  workout, share-image generator).
- **Challenges** — New/Joined sub-tabs with sliding underline, gold upsell,
  community cards (SVG hero art, Upcoming chip, overlapping avatars,
  join/leave). Definitions are local mock data; **progress is real**, accumulated
  from your health history inside each window, with a badge + local notification
  on completion. Calendar icon → monthly view of challenge dates.
- **Watch faces** — hero pack carousel, category tabs, 2-column grid of **22
  programmatic SVG faces** (Tetris blocks, glowing butterfly, line-art walker,
  pastel cat, brick-and-martini retro, spirograph, minimal analog, green terminal,
  galaxy, chronograph, orrery, zodiac, aurora, …) — every preview reads **live
  data** (time, steps, kcal, BPM). Tap → bezel preview with
  Apply / Favourite / Share. **Apply** sets the **Standby Clock**: a full-screen,
  kept-awake desk clock (`expo-keep-awake`) — the honest native use for
  watchfaces without a watch.
- **Shop** — catalog stub: featured card, category chips, grid (SVG product art),
  detail sheet, fake checkout → confirmation (clearly labelled), persisted
  wishlist hearts.
- **Onboarding** — welcome rings → validated profile (height feeds stride) →
  goal steppers → health permission with 90-day backfill progress and graceful
  denial (demo mode + fix-it path).
- **Profile** — editable fields, units, per-metric notification prefs, health
  connection status with re-request/settings deep-link, Gold state, JSON export,
  double-confirm reset-all, version.

---

## Code quality & conventions

- TypeScript strict, no `any`. Discriminated unions for workout types.
- Dumb UI primitives in `src/components/ui` (Ring, TriRing, MetricCard rows,
  StatPill, Sparkline, WorkoutChip, CategoryTabs, SnapCarousel, SegmentedTabs,
  ProgressBar, EmptyState, …).
- `HealthService` is the only module touching health libraries.
- No `console.log` — `src/lib/debug.ts` is a no-op in production builds.
- Micro-interactions: fade+slide screen transitions, tab-pill morph, card press
  scale 0.985, ring fill ease-out-cubic 1.2 s with synced count-up, sync spin,
  success haptics on milestones — all of it **respects Reduce Motion**
  (`AccessibilityInfo.isReduceMotionEnabled`).
- Accessibility: `accessibilityLabel` on every icon-only control, ≥44×44 touch
  targets, charts expose text summaries via accessibility props, WCAG-AA-minded
  contrast on dark.

### Documented deviations from the brief

- **Reanimated v4** (not v3): Expo SDK 56 ships and pins Reanimated 4 — same
  worklet API surface used here; v3 cannot be installed against RN 0.85.
- **Tabs import:** SDK 56's expo-router vendors React Navigation; the tab bar
  types come from `expo-router/js-tabs` rather than `@react-navigation/bottom-tabs`.
- **Hourly distance/calories charts** scale today's hourly *step* shape, because
  the cache stores hourly steps only — labelled as an estimate in the UI.
- **Heart-rate during recording** is captured as a sparse curve from the latest
  store sample (phones have no continuous HR sensor); the detail screen falls back
  to querying the workout window from the health store.

---

## Project layout

```
src/
├── app/                    # Expo Router routes
│   ├── (tabs)/             # Home, Challenges, Watch faces, Shop
│   ├── onboarding.tsx      # 4-step first launch
│   ├── steps|distance|calories|heart-rate|sleep|spo2|stress.tsx
│   ├── workouts/           # list + [id] detail
│   ├── record-workout.tsx  # live workout (full-screen modal)
│   ├── standby.tsx         # standby clock (applied watchface)
│   └── profile.tsx
├── components/
│   ├── ui/                 # dumb primitives
│   ├── charts/             # victory-native wrappers
│   ├── home/               # home-screen cards
│   ├── challenges/         # SVG hero art
│   └── watchfaces/         # 22 SVG faces + live-data hook
├── services/
│   ├── health/             # THE abstraction (ios / android / mock)
│   ├── db.ts               # SQLite cache
│   ├── sync.ts             # orchestration, backfill, challenge progress
│   ├── notifications.ts    # local notifications
│   └── background.ts       # background refresh task
├── stores/                 # Zustand + MMKV persistence
├── lib/                    # tokens, dates, format, streak, hooks, debug
├── types/                  # health domain types (incl. HealthService interface)
└── mocks/                  # promos, challenges, products (content only)
```

import { useEffect, useState } from 'react';

import { selectDisplayedSteps, useHealthStore } from '@/stores/useHealthStore';
import type { FaceData } from './faces';

/** Live data feed for watchfaces: ticking clock + real steps/kcal/bpm. */
export function useLiveFaceData(tickMs = 1000): FaceData {
  const [time, setTime] = useState(() => new Date());
  const today = useHealthStore((s) => s.today);
  const liveStepDelta = useHealthStore((s) => s.liveStepDelta);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  return {
    time,
    steps: selectDisplayedSteps({ today, liveStepDelta }),
    kcal: Math.round(today?.calories ?? 0),
    bpm: Math.round(today?.latestHeartRate?.bpm ?? 0),
  };
}

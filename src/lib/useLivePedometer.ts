import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { debug } from '@/lib/debug';
import { resolveCurrentSource } from '@/services/sync';
import { useHealthStore } from '@/stores/useHealthStore';

/**
 * Live foreground step ticker. The pedometer adds deltas between platform
 * refreshes; the platform total wins on every sync (the baseline resets so
 * counted steps are never double-added).
 */
export function useLivePedometer(): void {
  const lastSynced = useHealthStore((s) => s.lastSynced);
  const cumulativeRef = useRef(0);
  const baselineRef = useRef(0);

  // Reconcile: when a sync lands, fold the live delta into the baseline.
  useEffect(() => {
    baselineRef.current = cumulativeRef.current;
  }, [lastSynced]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const subscribe = async () => {
      const { service } = await resolveCurrentSource();
      if (cancelled) return;
      cumulativeRef.current = 0;
      baselineRef.current = 0;
      unsubscribe = service.observeTodaySteps((cumulative) => {
        cumulativeRef.current = cumulative;
        const delta = Math.max(0, cumulative - baselineRef.current);
        useHealthStore.getState().setLiveStepDelta(delta);
      });
      debug('pedometer', 'live step observer attached');
    };

    const teardown = () => {
      unsubscribe?.();
      unsubscribe = null;
      useHealthStore.getState().setLiveStepDelta(0);
    };

    void subscribe();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !unsubscribe) void subscribe();
      if (state !== 'active') teardown();
    });

    return () => {
      cancelled = true;
      sub.remove();
      teardown();
    };
  }, []);
}

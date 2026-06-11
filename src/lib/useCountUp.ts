import { useEffect, useRef, useState } from 'react';

import { useReduceMotion } from './useReduceMotion';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Count-up animation synced with the 1.2s ring fill (ease-out-cubic).
 * Returns the displayed value; jumps instantly under Reduce Motion.
 */
export function useCountUp(target: number, duration = 1200): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    const from = fromRef.current;
    const startedAt = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const value = from + (target - from) * easeOutCubic(t);
      setDisplay(value);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);

  return display;
}

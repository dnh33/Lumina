import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

function easeOutCubic(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - u, 3);
}

/**
 * Instrument Ink needle-settle count: rises quickly toward `target`, soft
 * overshoot, then still. Reduced motion → final value immediately.
 */
export function useNeedleCount(
  target: number | undefined,
  durationMs = 780,
): number | undefined {
  const reduce = useReducedMotion();
  const [value, setValue] = useState<number | undefined>(() =>
    reduce || target == null ? target : 0,
  );

  useEffect(() => {
    if (target == null) {
      setValue(undefined);
      return;
    }
    if (reduce) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const peak =
      target === 0 ? 0 : Math.max(target + 1, Math.round(target * 1.04));

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const t = Math.min(1, elapsed / Math.max(durationMs, 1));

      let next: number;
      if (t < 0.7) {
        next = Math.round(peak * easeOutCubic(t / 0.7));
      } else {
        const settle = easeOutCubic((t - 0.7) / 0.3);
        next = Math.round(peak + (target - peak) * settle);
      }

      // Hard clamp — never leave the [0, peak] corridor during the rise.
      next = Math.max(0, Math.min(peak, next));
      if (t >= 1) next = target;

      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce, durationMs]);

  return value;
}

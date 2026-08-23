import { useCallback } from "react";

/**
 * useHaptics — progressive, decorative haptic feedback.
 *
 * navigator.vibrate is unsupported on iOS Safari (silent no-op on every
 * iPhone) and only meaningful on Android Chrome. We guard the call so it is
 * always safe; on unsupported devices it does nothing.
 *
 * Haptics are decorative only — never a load-bearing signal. The visual state
 * (chip, spring, close) is the real feedback; the vibration is a quiet touch on
 * Android and silence on iPhone. That split is intentional and brand-compliant
 * (it never promises parity the platform can't deliver).
 */
export function useHaptics() {
  return useCallback((ms = 10) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        /* embedded webviews occasionally throw — ignore, it's decorative */
      }
    }
  }, []);
}

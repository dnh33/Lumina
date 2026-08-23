import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface PullToRefreshOptions {
  /** Scroll container — armed only when its scrollTop <= 0 (top of list). */
  scrollRef: React.RefObject<HTMLElement | null>;
  /** Inner wrapper whose transform follows the pull (keeps scroll body intact). */
  contentRef: React.RefObject<HTMLElement | null>;
  /** Async refresh; called once the pull crosses `threshold`. */
  onRefresh: () => void | Promise<void>;
  /** Pull distance (px) that triggers a refresh. */
  threshold?: number;
  /** Maximum pull travel (px) before resistance caps it. */
  maxPull?: number;
}

/**
 * usePullToRefresh — native, invisible pull-to-refresh for the conversation list.
 *
 * Brand note: this is gesture-native and chrome-free (a quiet "Opdaterer…" note
 * at most). It is *hush* — no buttons, no banner.
 *
 * Correctness guards (per platform research):
 *  - Armed ONLY when scrollTop <= 0, so we never double-fire the browser's own
 *    overscroll refresh or fight an in-progress scroll.
 *  - touchmove is bound non-passive so we can preventDefault the rubber-band
 *    without the "Unable to preventDefault inside passive event listener" warning.
 *  - The scroll container must carry `overscroll-contain` (caller's className)
 *    so the gesture doesn't chain to <body>.
 */
export function usePullToRefresh({
  scrollRef,
  contentRef,
  onRefresh,
  threshold = 72,
  maxPull = 120,
}: PullToRefreshOptions) {
  const reduceMotion = useReducedMotion();
  const [isRefreshing, setRefreshing] = useState(false);
  const [pullPx, setPullPx] = useState(0);

  const pullRef = useRef(0);
  const startY = useRef<number | null>(null);
  const armed = useRef(false);
  const refreshingRef = useRef(false);

  const apply = (px: number) => {
    pullRef.current = px;
    setPullPx(px);
    const el = contentRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = px ? `translateY(${px}px)` : "";
  };

  const settle = (px: number) => {
    const el = contentRef.current;
    if (el && !reduceMotion) el.style.transition = "transform 0.2s ease";
    apply(px);
  };

  const onStart = (e: TouchEvent) => {
    if (refreshingRef.current) return;
    startY.current = e.touches[0]?.clientY ?? null;
    const scroller = scrollRef.current;
    armed.current = !!scroller && scroller.scrollTop <= 0;
  };

  const onMove = (e: TouchEvent) => {
    if (!armed.current || startY.current == null || refreshingRef.current) return;
    const scroller = scrollRef.current;
    if (scroller && scroller.scrollTop > 0) {
      // user scrolled into content mid-gesture — disarm, release any pull
      armed.current = false;
      if (pullRef.current) settle(0);
      return;
    }
    const dy = (e.touches[0]?.clientY ?? startY.current) - startY.current;
    if (dy <= 0) {
      if (pullRef.current) settle(0);
      return;
    }
    e.preventDefault(); // safe: non-passive listener
    settle(Math.min(dy * 0.5, maxPull));
  };

  const onEnd = async () => {
    if (!armed.current) return;
    const px = pullRef.current;
    startY.current = null;
    armed.current = false;
    if (px >= threshold) {
      refreshingRef.current = true;
      setRefreshing(true);
      apply(threshold); // hold at threshold while working
      try {
        await onRefresh();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        settle(0);
      }
    } else {
      settle(0);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const start = onStart as EventListener;
    const move = onMove as EventListener;
    const end = onEnd as EventListener;
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end, { passive: true });
    el.addEventListener("touchcancel", end, { passive: true });
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef, contentRef, threshold, maxPull]);

  return { isRefreshing, pullPx, threshold };
}

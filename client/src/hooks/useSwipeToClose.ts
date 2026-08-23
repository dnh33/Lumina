import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface SwipeToCloseOptions {
  /** The panel that slides. */
  panelRef: React.RefObject<HTMLElement | null>;
  /** Called when the gesture passes the close threshold. */
  onClose: () => void;
  /** Fraction of panel width that commits the close. */
  closeRatio?: number;
  /** Horizontal inset (px) before which the OS owns the edge-swipe (back-nav). */
  edgeInset?: number;
}

/**
 * useSwipeToClose — drag the panel off-screen to dismiss it.
 *
 * Brand note: no scrim, no buttons. The slide IS the feedback (hush).
 *
 * Correctness guards (per platform research):
 *  - The panel's className must set `touch-action: pan-y` so a horizontal drag
 *    is claimed by us and never fights vertical scroll.
 *  - The drag handle / hit area sits >= `edgeInset` (24px) inside the screen
 *    edge, because both iOS and Android claim the outer 0-24px for back-nav.
 *  - Only horizontal motion counts; vertical scroll is ignored.
 *  - Reduced motion → instant close, no spring.
 */
export function useSwipeToClose({
  panelRef,
  onClose,
  closeRatio = 0.33,
  edgeInset = 24,
}: SwipeToCloseOptions) {
  const reduceMotion = useReducedMotion();
  const [dragPx, setDragPx] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const width = useRef(0);
  const horizontal = useRef(false);
  const dragging = useRef(false);
  const committed = useRef(false);

  const apply = (px: number) => {
    setDragPx(px);
    const el = panelRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = px ? `translateX(${px}px)` : "";
  };

  const onStart = (e: TouchEvent) => {
    if (committed.current) return;
    const el = panelRef.current;
    if (!el) return;
    const t = e.touches[0];
    if (!t) return;
    const rect = el.getBoundingClientRect();
    width.current = rect.width;
    // Ignore touches starting in the OS-owned outer edge (back-nav zone).
    if (t.clientX - rect.left < edgeInset) {
      startX.current = null;
      return;
    }
    startX.current = t.clientX;
    startY.current = t.clientY;
    horizontal.current = false;
    dragging.current = true;
  };

  const onMove = (e: TouchEvent) => {
    if (!dragging.current || startX.current == null) return;
    const t = e.touches[0];
    if (!t) return;
    const dx = t.clientX - startX.current;
    const dy = (startY.current != null ? t.clientY : t.clientY) - (startY.current ?? t.clientY);
    if (!horizontal.current) {
      // decide orientation once movement is meaningful
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        horizontal.current = Math.abs(dx) >= Math.abs(dy) && dx < 0;
      }
      if (!horizontal.current) return;
    }
    if (dx >= 0) {
      apply(0); // only allow dragging left (away from edge)
      return;
    }
    e.preventDefault(); // non-passive: claim the horizontal drag
    apply(dx);
  };

  const onEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    const px = dragPx;
    startX.current = null;
    startY.current = null;
    horizontal.current = false;
    const threshold = width.current * closeRatio;
    if (px <= -threshold) {
      committed.current = true;
      const el = panelRef.current;
      if (el && !reduceMotion) el.style.transition = "transform 0.2s cubic-bezier(.22,1,.36,1)";
      apply(-(width.current || 0) - 40);
      onClose();
    } else {
      const el = panelRef.current;
      if (el && !reduceMotion) el.style.transition = "transform 0.2s cubic-bezier(.22,1,.36,1)";
      apply(0);
    }
  };

  useEffect(() => {
    const el = panelRef.current;
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
  }, [panelRef, closeRatio, edgeInset]);

  return { dragPx };
}

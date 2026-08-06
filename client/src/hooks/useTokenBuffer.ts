import { useCallback, useEffect, useRef, useState } from "react";

/** 24ms cadence (T6: ~16–50ms). Buffer flushes on this interval. */
export const TOKEN_BUFFER_INTERVAL_MS = 24;

/**
 * Pure flush helper (T6). Given the buffer of accumulated text, returns the
 * concatenated string. Exported for unit testing independent of timers.
 * Called by the hook on each cadence tick.
 */
export function bufferFlush(buffer: string[]): string {
  return buffer.join("");
}

/**
 * Buffers incoming text deltas and flushes the concatenated text on a ~24ms
 * cadence (T6: avoids one-render-per-token thrash). Returns the latest flushed
 * text plus a `push` to enqueue a delta and `reset` to clear.
 *
 * The flush is batched to roughly one frame so React renders ≤1× per cadence
 * even when the network emits tokens in bursts.
 */
export function useTokenBuffer(
  onFlush?: (text: string) => void,
  intervalMs: number = TOKEN_BUFFER_INTERVAL_MS,
): {
  text: string;
  push: (delta: string) => void;
  reset: () => void;
  /** Flush any pending buffer immediately (used at turn boundaries). */
  flush: () => void;
} {
  // State is intentionally kept in refs + a single React state for the flushed
  // text so consumers re-render only when a flush lands.
  const bufferRef = useRef<string[]>([]);
  const onFlushRef = useRef(onFlush);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [text, setText] = useState<string>("");

  onFlushRef.current = onFlush;

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const joined = bufferFlush(bufferRef.current);
    bufferRef.current = [];
    // Append this cadence's batch onto prior flushed text — never replace.
    // Replacing made ChatThread's `streamedText || assistantText` flash only
    // the latest ~24ms shard (letters/symbols) until the persisted reply landed.
    setText((prev) => {
      const next = prev + joined;
      onFlushRef.current?.(next);
      return next;
    });
  }, []);

  const ensureTimer = useCallback(() => {
    if (timerRef.current != null) return;
    timerRef.current = setInterval(flush, intervalMs);
  }, [flush, intervalMs]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const push = useCallback(
    (delta: string) => {
      if (delta.length === 0) return;
      bufferRef.current.push(delta);
      ensureTimer();
    },
    [ensureTimer],
  );

  const reset = useCallback(() => {
    bufferRef.current = [];
    clearTimer();
    setText("");
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { text, push, reset, flush };
}

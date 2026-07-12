import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { EASE_OUT_EXPO } from "../../lib/motion";

/**
 * ToolTrace — the ordered tool-use trace rail (Cluster C / T11–T13).
 *
 * Replaces the flat chip ribbon with a left-rail timeline: a continuous
 * connecting line, one node per tool event, a per-step bead on the rail,
 * an in-flight "spark travel" dot (reduce-aware), and a summary chip that
 * shows the human `summary` (never raw JSON args) with a FIXED min-height
 * so the spinner→summary swap never shifts layout (T13).
 *
 * Motion is GPU-only (transform / opacity / filter). Gold glow appears
 * only on the active step / in-flight spark. Entrances use EASE_OUT_EXPO.
 */

export interface ToolTraceNode {
  name: string;
  done: boolean;
  /** Human summary from tool_done — never raw JSON / args. */
  summary?: string;
}

export interface ToolTraceProps {
  steps: ToolTraceNode[];
  className?: string;
}

/** x (px) where the connecting line + beads + spark live on the rail. */
const RAIL_X = 14;

// Imported easing constants are `readonly` tuples (motion.ts `as const`);
// framer-motion's `ease` wants a mutable 4-tuple, so re-type once.
type Bezier = [number, number, number, number];
const EXPO = EASE_OUT_EXPO as unknown as Bezier;

export function ToolTrace({ steps, className = "" }: ToolTraceProps) {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [railH, setRailH] = useState(0);

  // Measure the rail so the spark can travel its full height via transform.
  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const measure = () => setRailH(el.clientHeight);
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [steps.length]);

  if (!steps.length) return null;

  // The earliest not-done step is the one "in flight".
  const firstPending = steps.findIndex((s) => !s.done);
  const anyRunning = firstPending !== -1;

  return (
    <div data-testid="tooltrace" className={`relative ${className}`} ref={railRef}>
      {/* Connecting vertical line (GPU paint; transform/opacity only). */}
      <div
        data-testid="tooltrace-line"
        aria-hidden
        className="pointer-events-none absolute top-3 bottom-3 w-px rounded-full bg-gradient-to-b from-gold-400/70 via-gold-400/25 to-transparent"
        style={{ left: RAIL_X }}
      />

      {/* In-flight spark travelling the rail (reduce-aware, transform only). */}
      {anyRunning && !reduceMotion && (
        <motion.span
          data-testid="tooltrace-spark"
          aria-hidden
          className="pointer-events-none absolute h-2 w-2 rounded-full bg-gold-400"
          style={{
            left: RAIL_X - 4,
            top: 0,
            boxShadow: "0 0 12px rgba(232,184,75,0.75)",
            willChange: "transform",
          }}
          animate={{ y: railH > 0 ? [0, railH] : 0, opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const isActive = i === firstPending;
          const beadDone = step.done;
          return (
            <li
              key={`${step.name}-${i}`}
              data-testid="tooltrace-node"
              className="relative flex items-start gap-3"
              style={{ minHeight: "44px" }}
            >
              {/* Per-step bead on the rail (P5). Glow only on the active step. */}
              <span
                aria-hidden
                className={`absolute h-2.5 w-2.5 rounded-full ${
                  beadDone
                    ? "bg-gold-400"
                    : isActive
                      ? "bg-gold-300"
                      : "bg-white/15"
                }`}
                style={{
                  left: RAIL_X - 5,
                  top: 7,
                  ...(isActive
                    ? { boxShadow: "0 0 10px rgba(232,184,75,0.6)" }
                    : null),
                }}
              />

              {/* Status: spinner → check swapped via AnimatePresence. */}
              <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <AnimatePresence initial={false} mode="wait">
                  {step.done ? (
                    <motion.span
                      key="check"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2, ease: EXPO }}
                    >
                      <Check
                        className="h-3.5 w-3.5 text-gold-300"
                        strokeWidth={3}
                      />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="spinner"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.2, ease: EXPO }}
                    >
                      {reduceMotion ? (
                        <Loader2 className="h-3.5 w-3.5 text-gold-300" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-300" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {/* Summary chip — human text, never raw JSON. Fixed min-height
                  so spinner→summary never shifts layout (T13). Pops in with a
                  spring (R14) when it resolves. */}
              <div className="min-w-0 flex-1">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 24 }}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1 text-2xs font-medium text-mist-300 ring-1 ring-white/[0.08]"
                  style={{ minHeight: "28px" }}
                >
                  {step.summary ? (
                    <span className="truncate">{step.summary}</span>
                  ) : (
                    <span className="truncate text-mist-400">{step.name}</span>
                  )}
                </motion.div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

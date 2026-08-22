/**
 * SparkAvatar — Lumina's living presence (the "face").
 *
 * One honest primitive — the brand 4-point star ("star-core") — rendered in five
 * distinct visual states driven by `useCompanionState`. Personality comes from
 * light, cadence, and a calm Fraunces "state whisper", never a mascot.
 *
 * Motion is GPU-only (transform / opacity / filter). Every infinite loop is
 * disabled under `useReducedMotion()` → a still, beautifully rendered core
 * (presence P16 / recipe R16). The app root is wrapped in
 * <MotionConfig reducedMotion="user">.
 *
 * Public API note: this supersedes the wave-1 inline `Spark` (props `size`,
 * `breathing`). `size` and `className` are preserved; `breathing` is subsumed by
 * the `state` machine ("idle" breathes). New props are all optional and additive
 * so ChatThread keeps compiling.
 */

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import { useEffect } from "react";
import { EASE_OUT_EXPO } from "../../lib/motion";
import type { CompanionState } from "../../hooks/useCompanionState";

export interface SparkAvatarProps {
  /** Presence state. Drives every visual. */
  state: CompanionState;
  /** One-shot: pop a gold "memory constellation" star (P13) when true. */
  showMemoryPulse?: boolean;
  /** Hide the Fraunces state-whisper (used when the parent renders status text). */
  hideWhisper?: boolean;
  /** Rendered pixel size of the core. Preserved from the wave-1 API. */
  size?: number;
  /** Extra classes on the root. Preserved from the wave-1 API. */
  className?: string;
}

/** Calm, per-state copy for the Fraunces state-whisper (P15). */
const WHISPER: Record<CompanionState, string> = {
  idle: "",
  thinking: "considering…",
  tooling: "reaching into your library…",
  writing: "composing…",
  error: "",
};

/** Distinct accessible label per state. */
const ARIA: Record<CompanionState, string> = {
  idle: "Lumina is present",
  thinking: "Lumina is considering",
  tooling: "Lumina is reaching into your library",
  writing: "Lumina is composing",
  error: "Lumina encountered an error",
};

const GOLD = "#e8b84b";
const GOLD_SOFT = "#f2d288";

/* ── The brand mark ─────────────────────────────────────────────── */

const STAR_PATH = "M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z";

function StarCore({
  animating,
  animate,
  transition,
  style,
}: {
  animating: boolean;
  animate?: TargetAndTransition;
  transition?: Transition;
  style?: React.CSSProperties;
}) {
  return (
    <motion.svg
      data-part="star-core"
      data-animating={animating ? "true" : "false"}
      viewBox="0 0 100 100"
      className="relative z-10 h-full w-full overflow-visible"
      aria-hidden
      animate={animate}
      transition={transition}
      style={style}
    >
      <path d={STAR_PATH} fill={GOLD} />
    </motion.svg>
  );
}

/* ── Thought ripples (thinking, P2) ─────────────────────────────── */

function Ripples({ reduce }: { reduce: boolean }) {
  // 3 concentric rings, staggered outward then fading.
  const rings = [0, 1, 2];
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    >
      {rings.map((i) => (
        <motion.circle
          key={i}
          data-part="ripple"
          cx="50"
          cy="50"
          r="24"
          fill="none"
          stroke={GOLD}
          strokeWidth="1.5"
          style={{ transformOrigin: "50% 50%" }}
          initial={{ scale: 0.5, opacity: reduce ? 0.35 : 0 }}
          animate={
            reduce
              ? { scale: 1, opacity: 0.35 }
              : { scale: [0.5, 1.8], opacity: [0.5, 0] }
          }
          transition={
            reduce
              ? { duration: 0.2 }
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.6,
                }
          }
        />
      ))}
    </svg>
  );
}

/* ── Tooling: satellite orbit (P4) ──────────────────────────────── */

function ToolingLayer({ reduce }: { reduce: boolean }) {
  return (
    /* Satellite dot orbiting the core (R7 offset-path / rotate). */
    <motion.div
      data-part="satellite"
      className="pointer-events-none absolute inset-0"
      style={{ transformOrigin: "50% 50%" }}
      animate={reduce ? { rotate: 0 } : { rotate: 360 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 2.8, repeat: Infinity, ease: "linear" }
      }
    >
      <span
        className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
        style={{ background: GOLD_SOFT, boxShadow: `0 0 6px ${GOLD}` }}
      />
    </motion.div>
  );
}

/* ── Writing: gold comet riding the caret path (P3, R7) ─────────── */

function Comet({ reduce }: { reduce: boolean }) {
  const cadence = useMotionValue(reduce ? 1 : 0);
  const trailOpacity = useTransform(cadence, [0, 1], [0.45, 1]);
  const trailGlow = useTransform(
    cadence,
    [0, 1],
    [`0 0 4px ${GOLD}`, `0 0 16px ${GOLD}, 0 0 10px ${GOLD_SOFT}`],
  );

  useEffect(() => {
    if (reduce) return;
    const controls = animate(cadence, 1, {
      duration: 1.1,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [reduce, cadence]);

  return (
    <>
      <motion.span
        data-part="comet"
        className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
        style={{
          background: GOLD_SOFT,
          boxShadow: `0 0 8px ${GOLD}, 0 0 14px rgba(232,184,75,0.5)`,
          opacity: trailOpacity,
          offsetPath: `path("M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z")`,
          offsetDistance: reduce ? "50%" : undefined,
        }}
        animate={
          reduce
            ? { opacity: 0.6 }
            : { offsetDistance: ["0%", "100%"] as unknown as string[] }
        }
        transition={
          reduce
            ? { duration: 0.2 }
            : { duration: 2.2, repeat: Infinity, ease: "linear" }
        }
      />
      <motion.span
        data-part="caret-trail"
        className="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 rounded"
        style={{
          background: GOLD,
          boxShadow: reduce ? `0 0 8px ${GOLD}` : trailGlow,
        }}
      />
    </>
  );
}

/* ── Error: red-gold hairline fault-line (P14) — NO shake ───────── */

function FaultLine({ reduce }: { reduce: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden
    >
      <motion.line
        data-part="fault-line"
        x1="20"
        y1="38"
        x2="82"
        y2="66"
        stroke="url(#fault-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={
          reduce ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT_EXPO }
        }
      />
      <defs>
        <linearGradient id="fault-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c2453b" />
          <stop offset="100%" stopColor={GOLD} />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Memory constellation pop (P13) — one-shot gold star ─────────── */

function MemoryPulse({ reduce }: { reduce: boolean }) {
  return (
    <motion.svg
      data-part="memory-pulse"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute -right-1 -top-1 h-1/2 w-1/2 overflow-visible"
      aria-hidden
      initial={{ opacity: 0, scale: reduce ? 1 : 0.3 }}
      animate={{ opacity: reduce ? 1 : [0, 1, 0.85], scale: 1 }}
      transition={reduce ? { duration: 0.2 } : { duration: 0.6, ease: EASE_OUT_EXPO }}
    >
      <path d={STAR_PATH} fill={GOLD_SOFT} />
    </motion.svg>
  );
}

/* ── Root ───────────────────────────────────────────────────────── */

export function SparkAvatar({
  state,
  showMemoryPulse = false,
  hideWhisper = false,
  size = 20,
  className = "",
}: SparkAvatarProps) {
  const reduceRaw = useReducedMotion();
  const reduce = !!reduceRaw;

  // Only "active" states glow (gold is rare — P-gold).
  const glow =
    !reduce && (state === "writing" || state === "tooling")
      ? { filter: `drop-shadow(0 0 6px rgba(232,184,75,0.45))` }
      : undefined;

  // Core animation per state (transform / opacity only).
  const coreAnimate: TargetAndTransition = (() => {
    if (reduce) return { scale: 1, opacity: state === "idle" ? 0.9 : 1 };
    switch (state) {
      case "idle":
        return { scale: [1, 1.035, 1], opacity: [0.88, 1, 0.88] }; // R5 breathing ~3.2s
      case "writing":
        return { opacity: [0.7, 1, 0.7] }; // core tracks token cadence
      case "error":
        return { scale: 1, opacity: 1 };
      default:
        return { scale: 1, opacity: 1 };
    }
  })();

  const coreTransition: Transition = (() => {
    if (reduce) return { duration: 0.2 };
    switch (state) {
      case "idle":
        return { duration: 3.2, repeat: Infinity, ease: "easeInOut" };
      case "writing":
        return { duration: 1.1, repeat: Infinity, ease: "easeInOut" };
      default:
        return { duration: 0.3, ease: EASE_OUT_EXPO };
    }
  })();

  const coreLoops =
    !reduce && (state === "idle" || state === "writing");

  const whisper = WHISPER[state];

  return (
    <span
      data-state={state}
      data-reduced={reduce ? "true" : "false"}
      data-shake="false"
      data-error-pulse={!reduce && state === "error" ? "true" : "false"}
      role="img"
      aria-label={ARIA[state]}
      className={`inline-flex flex-col items-center gap-1 ${className}`}
    >
      <span
        className="relative inline-block"
        style={{
          width: size,
          height: size,
          // error desaturates the whole presence (P14).
          filter: state === "error" ? "grayscale(0.85)" : glow?.filter,
          animation:
            !reduce && state === "error"
              ? "error-pulse 2.4s ease-in-out infinite"
              : undefined,
        }}
      >
        <StarCore
          animating={coreLoops}
          animate={coreAnimate}
          transition={coreTransition}
          style={{ transformOrigin: "50% 50%" }}
        />

        {state === "thinking" && <Ripples reduce={reduce} />}
        {state === "tooling" && <ToolingLayer reduce={reduce} />}
        {state === "writing" && <Comet reduce={reduce} />}
        {state === "error" && <FaultLine reduce={reduce} />}
        {showMemoryPulse && <MemoryPulse reduce={reduce} />}
      </span>

      {whisper && !hideWhisper && (
        <motion.span
          // The ONLY element permitted the Fraunces serif (P-type). In this repo
          // Fraunces is exposed via the `font-display` utility, not `font-serif`.
          className="font-display text-2xs italic leading-none text-mist-400"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0.2 } : { duration: 0.3, ease: EASE_OUT_EXPO }}
        >
          {whisper}
        </motion.span>
      )}
    </span>
  );
}

export default SparkAvatar;

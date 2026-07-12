import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, stagger60 } from "../../lib/motion";

interface MemoryConstellationProps {
  className?: string;
}

/** A few gold stars — the "memory constellation" motif (P13). Transform/opacity only. */
const STARS = [
  { top: "8%", left: "10%", size: 10, delay: 0.0 },
  { top: "46%", left: "52%", size: 15, delay: 0.12 },
  { top: "16%", left: "80%", size: 8, delay: 0.22 },
  { top: "62%", left: "26%", size: 9, delay: 0.3 },
];

function Star({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <path d="M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z" fill="#e8b84b" />
    </svg>
  );
}

export function MemoryConstellation({ className }: MemoryConstellationProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      aria-hidden
      variants={stagger60}
      initial="hidden"
      animate="show"
      className={`relative h-16 w-full max-w-xs ${className ?? ""}`}
    >
      {STARS.map((s, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 },
            show: {
              opacity: 0.9,
              scale: 1,
              transition: { duration: 0.5, delay: s.delay, ease: EASE_OUT_EXPO },
            },
          }}
          style={{ position: "absolute", top: s.top, left: s.left }}
          className="inline-block drop-shadow-[0_0_6px_rgba(232,184,75,0.45)]"
        >
          <Star size={s.size} />
        </motion.span>
      ))}
    </motion.div>
  );
}

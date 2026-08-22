import { motion, useReducedMotion } from "framer-motion";

export function WaveformSkeleton({ phase }: { phase: "starting" | "thinking" | "tooling" | "writing" }) {
  const reduce = useReducedMotion();
  const isVisible = phase !== "writing"; // Hide when content starts streaming
  const barCount = phase === "tooling" ? 5 : 3; // More bars during tooling
  const bars = Array.from({ length: barCount });

  if (phase === "writing" || !isVisible) return null;

  return (
    <span
      className="inline-flex items-end gap-0.5 ml-1 align-middle"
      data-testid="waveform-skeleton"
    >
      {bars.map((_, i) => (
        <motion.span
          key={i}
          data-part="waveform-bar"
          className="w-[2px] rounded bg-gold-300/70"
          style={{ height: 12, opacity: 0.45 }}
          animate={
            reduce
              ? { opacity: [0.45, 0.7, 0.45] }
              : { height: [10, 22, 10] }
          }
          transition={{
            duration: reduce ? 2 : 1.1,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.06,
          }}
        />
      ))}
    </span>
  );
}

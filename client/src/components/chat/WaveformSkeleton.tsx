import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO } from "../../lib/motion";

// Tooling animation variants — each tool type gets a distinct waveform character
// so the bars reflect what the model is actually doing (T6: tool attribution).
const TOOL_VARIANTS = {
  search: { height: [10, 24, 10], opacity: [0.45, 0.8, 0.45] },       // TMDB/library search: taller peaks
  library: { height: [10, 18, 10], opacity: [0.45, 0.75, 0.45] },     // read: medium
  write: { height: [10, 14, 10], opacity: [0.45, 0.65, 0.45] },          // save: shorter, steadier
  default: { height: [10, 22, 10], opacity: [0.45, 0.7, 0.45] },        // fallback: standard
};

const TOOL_DURATIONS: Record<string, number> = {
  search: 0.9,   // searching → faster pulse
  library: 1.1,  // reading → standard
  write: 1.3,    // saving → slightly slower, deliberate
  default: 1.1,
};

// Map tool name → category for waveform style selection.
function toolCategory(name: string): keyof typeof TOOL_VARIANTS {
  if (name.includes("search") || name === "discover_titles") return "search";
  if (name === "add_to_library" || name.includes("update") || name.includes("set_episode") || name.includes("save")) return "write";
  if (name.includes("get_") || name.includes("check_") || name === "compare_titles") return "library";
  return "default";
}

export function WaveformSkeleton({
  phase,
  activeTool,
}: {
  phase: "starting" | "thinking" | "tooling" | "writing";
  /** The in-progress tool name — drives bar animation character during tooling. */
  activeTool?: string;
}) {
  const reduce = useReducedMotion();
  const isVisible = phase !== "writing"; // Hide when content starts streaming
  const barCount = phase === "tooling" ? 5 : 3; // More bars during tooling
  const bars = Array.from({ length: barCount });

  if (phase === "writing" || !isVisible) return null;

  const category = activeTool ? toolCategory(activeTool) : "default";
  const variant = TOOL_VARIANTS[category];
  const duration = TOOL_DURATIONS[category];

  return (
    <span
      className="inline-flex items-end gap-0.5 ml-1 align-middle"
      data-testid="waveform-skeleton"
    >
      {bars.map((_, i) => (
        <motion.span
          key={i}
          data-part="waveform-bar"
          className="keep-transform-transition w-[2px] rounded bg-gold-300/70"
          style={{ height: 12, opacity: 0.45 }}
          animate={
            reduce
              ? { opacity: [0.45, 0.7, 0.45] }
              : phase === "tooling" && activeTool
              ? variant
              : { height: [10, 22, 10] }
          }
          transition={{
            duration: reduce ? 2 : duration,
            repeat: Infinity,
            ease: EASE_OUT_EXPO,
            delay: i * 0.06,
          }}
        />
      ))}
    </span>
  );
}

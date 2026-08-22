import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  BookmarkPlus,
  Brain,
  Check,
  ChevronDown,
  Compass,
  Info,
  LibraryBig,
  ListChecks,
  ListVideo,
  PenLine,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";
import { EASE_OUT_EXPO } from "../../lib/motion";
import { summarizeTrace, groupConcurrentSteps, buildToolNodes } from "./buildToolNodes";
import { ToolResultCard } from "./ToolResultCard";

/**
 * ToolTrace — the ordered tool-use trace rail (Cluster C / T11–T13),
 * refined for progressive disclosure:
 *
 *  · WORKING — a compact timeline: one single-line row per step showing the
 *    verb label, the salient argument ("“korean thrillers”") and, once done,
 *    a result digest ("8 results"). Only the ACTIVE step is animated (pulsing
 *    bead + gold label); finished steps settle to quiet mist. The travelling
 *    spark and connecting rail are kept (reduce-aware, GPU-only).
 *
 *  · DONE — the rows tuck themselves away into one past-tense summary line
 *    ("Read your library · Searched the catalog ×5 · Pulled title details ×4")
 *    with a chevron to re-open the full trace. Persisted turns render the
 *    same collapsed line, so history stays quiet.
 *
 * Text is always human fragments from the server presenter — never raw JSON.
 * Gold stays rare: the active step, the spark, and the summary check only.
 */

export interface ToolTraceNode {
  name: string;
  done: boolean;
  /** Human verb label ("Searching the catalog") or write receipt. */
  summary?: string;
  /** Salient argument ("“korean thrillers”"). */
  detail?: string;
  /** Result digest ("8 results", "Counterpart (2018)"). */
  outcome?: string;
}

export interface ToolTraceProps {
  steps: ToolTraceNode[];
  className?: string;
}

/** Tool → glyph, for at-a-glance row recognition (moved from ChatThread). */
const TOOL_ICONS: Record<string, typeof Search> = {
  search_library: LibraryBig,
  get_taste_profile: Brain,
  search_tmdb: Search,
  get_title_details: Info,
  discover_titles: Compass,
  add_to_library: BookmarkPlus,
  update_library_entry: PenLine,
  set_episode_progress: ListChecks,
  get_episode_progress: ListVideo,
  compare_titles: Scale,
  get_episode_recap: BookOpen,
  check_continuing_series: RefreshCw,
};

/** x (px) where the connecting line + beads + spark live on the rail. */
const RAIL_X = 8;

// Imported easing constants are `readonly` tuples (motion.ts `as const`);
// framer-motion's `ease` wants a mutable 4-tuple, so re-type once.
type Bezier = [number, number, number, number];
const EXPO = EASE_OUT_EXPO as unknown as Bezier;

export function ToolTrace({ steps, className = "" }: ToolTraceProps) {
  const reduceMotion = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [railH, setRailH] = useState(0);
  // null = automatic (open while working, collapsed once done);
  // true/false = the user toggled and their choice wins.
  const [userOpen, setUserOpen] = useState<boolean | null>(null);

  // Group identical concurrent (not-done) tool steps into batched rows so
  // 6× search_tmdb renders as one line with a count badge, not 6 identical rows.
  const nodes = groupConcurrentSteps(buildToolNodes(steps));

  // The earliest not-done node is the one "in flight".
  const firstPending = nodes.findIndex((n) => !n.done);
  const anyRunning = firstPending !== -1;
  const allDone = nodes.length > 0 && !anyRunning;
  const open = userOpen ?? !allDone;

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
  }, [steps.length, open]);

  if (!steps.length) return null;

  return (
    <div data-testid="tooltrace" className={`relative ${className}`}>
      {/* Collapsed one-line summary — the trace at rest (T13: fixed height,
          human text). Chevron re-opens the full timeline. */}
      {allDone && (
        <button
          type="button"
          data-testid="tooltrace-summary"
          onClick={() => setUserOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Hide the tool trace" : "Show the tool trace"}
          className="group flex max-w-full cursor-pointer items-center gap-1.5 rounded-md py-0.5 text-2xs text-mist-400 transition hover:text-mist-200"
          style={{ minHeight: "20px" }}
        >
          <Check className="h-3 w-3 shrink-0 text-gold-400/80" strokeWidth={3} />
          <span className="truncate">{summarizeTrace(steps)}</span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-mist-400/70 transition-transform group-hover:text-gold-300 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      )}

      {/* Animate via max-height instead of mount/unmount (T13: no jump on collapse) */}
      <motion.div
        data-testid="tooltrace-rows"
        ref={railRef}
        initial={false}
        animate={{
          maxHeight: open ? Math.max(railH, 40) : 0,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        transition={{ duration: 0.3, ease: EXPO }}
        className={`relative overflow-hidden ${allDone ? "mt-1" : ""}`}
        style={{ maxHeight: open ? Math.max(railH, 40) : 0 }}
      >
            {/* Connecting vertical line (GPU paint; transform/opacity only). */}
            <div
              data-testid="tooltrace-line"
              aria-hidden
              className="pointer-events-none absolute top-2 bottom-2 w-px rounded-full bg-gradient-to-b from-gold-400/60 via-gold-400/20 to-transparent"
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

            <ol className="flex flex-col gap-1">
              {nodes.map((step, i) => {
                const isActive = i === firstPending;
                const Icon = TOOL_ICONS[step.name] ?? Search;
                const isBatched = (step.count ?? 1) > 1;
                return (
                  <>
                  <motion.li
                    key={`${step.name}-${i}`}
                    data-testid="tooltrace-node"
                    initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, ease: EXPO }}
                    className="relative flex items-center gap-2 pl-[22px]"
                    style={{ minHeight: "24px" }}
                  >
                    {/* Bead on the rail carries the status: pending (faint),
                        active (pulsing gold + glow), done (settled gold). */}
                    {isActive && !reduceMotion ? (
                      <motion.span
                        aria-hidden
                        className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gold-300"
                        style={{
                          left: RAIL_X - 3,
                          boxShadow: "0 0 8px rgba(232,184,75,0.6)",
                        }}
                        animate={{ opacity: [0.45, 1, 0.45] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${
                          step.done
                            ? "bg-gold-400/50"
                            : isActive
                              ? "bg-gold-300"
                              : "bg-white/15"
                        }`}
                        style={{
                          left: RAIL_X - 3,
                          ...(isActive
                            ? { boxShadow: "0 0 8px rgba(232,184,75,0.6)" }
                            : null),
                        }}
                      />
                    )}

                    <Icon
                      aria-hidden
                      className={`h-3 w-3 shrink-0 ${
                        isActive ? "text-gold-300" : "text-mist-400/60"
                      }`}
                    />

                    {/* One line: verb label · argument · result digest. */}
                    <span className="min-w-0 flex-1 truncate text-2xs leading-5">
                      <span
                        className={
                          isActive
                            ? "font-medium text-gold-300"
                            : step.done
                              ? "text-mist-300"
                              : "text-mist-400/70"
                        }
                      >
                        {step.summary ?? step.name}
                      </span>
                      {/* Batch count badge: shows when concurrent calls are merged */}
                      {isBatched && (
                        <span className="ml-1 rounded-sm bg-white/10 px-1.5 py-0.5 text-mist-400/80 not-italic">
                          ×{step.count}
                        </span>
                      )}
                      {step.detail && (
                        <span
                          className={isActive ? "text-mist-200" : "text-mist-300/70"}
                        >
                          {" · "}
                          {step.detail}
                        </span>
                      )}
                      {step.done && step.outcome && (!isBatched ? (
                        <span className="text-mist-400/80">
                          {" · "}
                          {step.outcome}
                        </span>
                      ) : null)}
                    </span>
                  </motion.li>
                  {step.done && <ToolResultCard node={step} />}
                </>
                );
              })}
            </ol>
      </motion.div>
    </div>
  );
}

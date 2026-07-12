import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { EASE_OUT_EXPO } from "../../lib/motion";

export interface ReasoningStep {
  label: string;
  status: "running" | "done";
}

interface ReasoningInterstitialProps {
  /** Whether the interstitial is anchored/visible during a tool-heavy turn. */
  visible: boolean;
  /** Ordered list of steps shown in the collapsible "How I got there" trace. */
  steps: ReasoningStep[];
  className?: string;
}

/**
 * Client-simulated "Lumina is working" interstitial (D1=a — no backend).
 * Anchored panel shown during tool-heavy turns. The step trace is
 * collapsed-but-peekable by default (T9/T10); toggling reveals the ordered
 * steps. Fully usable under reduced motion (no animation required).
 */
export function ReasoningInterstitial({ visible, steps, className }: ReasoningInterstitialProps) {
  const reduce = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
          role="status"
          aria-live="polite"
          className={`flex flex-col gap-2 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.07] ${className ?? ""}`}
        >
          <div className="flex items-center gap-2 text-[0.8rem] text-mist-300">
            {reduce ? (
              <span className="h-2 w-2 rounded-full bg-gold-400" aria-hidden />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-400" aria-hidden />
            )}
            <span>Lumina is working</span>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1 self-start text-2xs font-medium uppercase tracking-wider text-mist-400 transition hover:text-gold-300"
          >
            How I got there
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.ol
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                className="space-y-1.5 border-l border-white/10 pl-3"
              >
                {steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-2xs text-mist-300">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        s.status === "done" ? "bg-gold-400" : "bg-mist-400"
                      }`}
                    />
                    {s.label}
                  </li>
                ))}
              </motion.ol>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

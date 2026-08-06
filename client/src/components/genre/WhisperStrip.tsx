import { useMemo } from "react";
import { guidedIdleWhisper } from "./guidedCurator.js";
import type { GuidedHudStage } from "./guidedStage.js";

interface Props {
  /** Decade bucket (e.g. 2010 → "2010s"). null = all eras / dial-ranked. */
  decade: number | null;
  /** Number of anchor titles used to seed the world. */
  anchorCount: number;
  /** Number of titles the user hasn't watched yet. */
  unwatched: number;
  /** When true, whisper acknowledges guided ranking of the rail. */
  guided?: boolean;
  /**
   * Live outcome from GuidedTour (dial / shelf act).
   * When set, replaces the default guided whisper so page chrome names what changed.
   */
  guidedCue?: string | null;
  /** Guided HUD stage - claim-cockpit voice (never bare "every era"). */
  guidedStage?: GuidedHudStage | null;
  /** Dial era band label (Classic / Turn / Now) when dial owns era. */
  eraBand?: string | null;
}

/**
 * WhisperStrip (C5, deterministic): a SHORT, template-built phrase summarizing
 * the current filter state. Deliberately NOT routed through the Companion LLM —
 * the string is a pure function of the props so it is stable and cheap.
 *
 * Guided idle copy lives in guidedCurator (Guided cockpit ownership).
 */
export function WhisperStrip({
  decade,
  anchorCount,
  unwatched,
  guided = false,
  guidedCue = null,
  guidedStage = null,
  eraBand = null,
}: Props) {
  const phrase = useMemo(() => {
    if (guided && guidedCue) return guidedCue;
    if (guided) {
      return guidedIdleWhisper({
        stage: guidedStage ?? "dial",
        eraBand,
        decade,
        anchorCount,
        unwatched,
      });
    }
    // Self: Timeline tab + URL own the decade - do not re-whisper it here.
    const scope = decade == null ? "every era" : "shelf";
    const anchors =
      anchorCount === 0 ? "no anchors" : `${anchorCount} anchor${anchorCount === 1 ? "" : "s"}`;
    const unwatchedWord =
      unwatched === 0 ? "all watched" : `${unwatched} unwatched`;
    return `Your ${scope} leans open - ${anchors}, ${unwatchedWord}.`;
  }, [
    decade,
    anchorCount,
    unwatched,
    guided,
    guidedCue,
    guidedStage,
    eraBand,
  ]);

  return (
    <p
      data-testid="whisper-strip"
      data-guided-cue={guided && guidedCue ? "1" : "0"}
      data-guided-stage={guided ? guidedStage ?? "dial" : undefined}
      role="status"
      aria-live="polite"
      className={`text-xs transition-colors duration-300 ${
        guided && guidedCue
          ? "text-[color-mix(in_oklab,var(--world-accent)_85%,transparent)]"
          : "text-white/40"
      }`}
    >
      {phrase}
    </p>
  );
}

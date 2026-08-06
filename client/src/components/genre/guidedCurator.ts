import type { GenreWorld } from "../../lib/genreWorld.js";
import type { GuidedBeatId } from "../../lib/types.js";

/** Projection-booth chrome copy — mirrors metaphor registers, not SaaS wizards. */
export function tourDeskTitle(
  world: GenreWorld,
  status: "active" | "complete" | "abandoned",
): string {
  if (status === "complete") {
    switch (world.metaphor) {
      case "Reading Room":
        return "Tonight's dossier is set";
      case "Constellation":
        return "Tonight's orbit is locked";
      case "Threshold":
        return "The door is chosen";
      case "Warm Interior":
        return "The room is ready";
      case "Frontier":
        return "The trail is marked";
      case "Panel":
        return "Tonight's spread is inked";
      default:
        return "Tonight is framed";
    }
  }
  switch (world.metaphor) {
    case "Reading Room":
      return "Walk the stacks with me";
    case "Constellation":
      return "Chart the sky with me";
    case "Threshold":
      return "Stand at the door with me";
    case "Warm Interior":
      return "Settle in with me";
    case "Frontier":
      return "Ride the ridge with me";
    case "Panel":
      return "Turn the page with me";
    default:
      return "Walk the world with me";
  }
}

export function tourDeskEyebrow(world: GenreWorld): string {
  return `${world.metaphor} · Tour desk`;
}

/** Human dial noun — never expose raw beat ids in the needle. */
export function dialNoun(beatId: GuidedBeatId): string {
  if (beatId === "tempo") return "Tempo";
  if (beatId === "era") return "Era";
  return "Risk";
}

/**
 * Answered-needle subtitle — first click opens radios; this names that step
 * so retune never reads as a dead click.
 * Idle copy is re-tune (not "choose") so completed Claim H1 and dial chrome agree.
 */
export function dialRetuneHint(isEditing: boolean): string {
  return isEditing ? "Choosing…" : "Tap to re-tune";
}

/** Active dial sheet cue — radios are the job, not the needle label. */
export function dialChooseCue(beatId: GuidedBeatId, isReDial: boolean): string {
  const noun = dialNoun(beatId).toLowerCase();
  if (isReDial) {
    return `Choose a new ${noun} setting — shelf follows.`;
  }
  return `Choose one ${noun} setting.`;
}

/**
 * Persistent "what to do now" line. Curator voice, one job.
 * Shown when no transient flash is active.
 */
export function nowCue(args: {
  answeredCount: number;
  total: number;
  nextBeatId: GuidedBeatId | undefined;
  status: "active" | "complete" | "abandoned";
  isReDial: boolean;
  reDialId?: GuidedBeatId;
}): string {
  if (args.isReDial && args.reDialId) {
    return `Re-tuning ${dialNoun(args.reDialId).toLowerCase()}. Pick a new setting - shelf follows.`;
  }
  if (args.status === "complete") {
    return "Frame set. Claim a shelf pick, tap a dial to re-tune, widen, or deepen via the companion.";
  }
  if (args.answeredCount === 0 && args.nextBeatId) {
    return `Your move: set ${dialNoun(args.nextBeatId).toLowerCase()} - one choice reshapes tonight's shelf.`;
  }
  if (args.nextBeatId) {
    const left = args.total - args.answeredCount;
    if (left === 1) {
      return `Last dial: ${dialNoun(args.nextBeatId).toLowerCase()}. Then the shelf locks to tonight.`;
    }
    return `Next: ${dialNoun(args.nextBeatId).toLowerCase()} (${args.answeredCount} of ${args.total} set).`;
  }
  return "Tour desk ready.";
}

export function resumeLine(
  answeredCount: number,
  total: number,
  status: "active" | "complete" | "abandoned",
): string | null {
  if (answeredCount <= 0) return null;
  if (status === "complete") {
    return `Resumed - all ${total} dials set. Shelf still live; tap a dial to re-tune, or Retake.`;
  }
  return `Resuming your tour - ${answeredCount} of ${total} dials set. Next dial waits below.`;
}

/** sessionStorage key — once per browser tab session, not every remount. */
export function resumeWhisperStorageKey(
  slug: string,
  mediaType: string,
): string {
  return `guided-resume-whisper:${slug}:${mediaType}`;
}

export function hasSeenResumeWhisper(
  slug: string,
  mediaType: string,
): boolean {
  try {
    return sessionStorage.getItem(resumeWhisperStorageKey(slug, mediaType)) === "1";
  } catch {
    return false;
  }
}

export function markResumeWhisperSeen(
  slug: string,
  mediaType: string,
): void {
  try {
    sessionStorage.setItem(resumeWhisperStorageKey(slug, mediaType), "1");
  } catch {
    /* private mode / blocked storage — whisper may repeat; acceptable */
  }
}

/** Transient flash after a dial - names what changed on the claim desk. */
export function rankFeedback(
  beatId: GuidedBeatId,
  choiceLabel: string,
): string {
  if (beatId === "tempo") {
    return `Tempo → ${choiceLabel}. Tonight shelf reshuffled.`;
  }
  if (beatId === "era") {
    return `Era → ${choiceLabel}. Ranking prefers that band; dial owns the era.`;
  }
  return `Risk → ${choiceLabel}. Comfort vs stretch reweights the shelf.`;
}

/**
 * Page-level whisper (WhisperStrip) after a dial - couples tour to visible outcomes.
 * Short, stable, no em-dashes. Claim cockpit has no warehouse rail.
 */
export function outcomeWhisper(
  beatId: GuidedBeatId,
  choiceLabel: string,
): string {
  if (beatId === "tempo") {
    return `Guided · tempo ${choiceLabel} · shelf reshaped`;
  }
  if (beatId === "era") {
    return `Guided · era ${choiceLabel} · dial owns band`;
  }
  return `Guided · risk ${choiceLabel} · shelf reweighted`;
}

/**
 * Idle guided whisper when no live cue - stage-aware, never bare "every era".
 * WhisperStrip / page chrome consume this; Guided owns the voice.
 */
export function guidedIdleWhisper(args: {
  stage: "seed" | "dial" | "claim" | "deepen" | "browse";
  eraBand: string | null;
  decade: number | null;
  anchorCount: number;
  unwatched: number;
}): string {
  const anchors =
    args.anchorCount === 0
      ? "no anchors"
      : `${args.anchorCount} anchor${args.anchorCount === 1 ? "" : "s"}`;
  const unwatchedWord =
    args.unwatched === 0 ? "all watched" : `${args.unwatched} unwatched`;
  const era =
    args.eraBand ??
    (args.decade != null ? `${args.decade}s` : "dial-ranked band");

  if (args.stage === "seed") {
    return `Guided seed · ${anchors}. Affinity first - dials wait.`;
  }
  if (args.stage === "dial") {
    return `Guided dials · ${era} · ${anchors}. Needle owns the fold.`;
  }
  if (args.stage === "claim" || args.stage === "deepen") {
    return `Guided claim · ${era} · ${anchors}, ${unwatchedWord}. Tonight shelf owns the fold.`;
  }
  // Browse: never claim Classic/Turn/Now band while scrub is All eras.
  if (args.decade == null && args.eraBand) {
    return `Guided widen · ${args.eraBand} parked · browsing all eras in band.`;
  }
  return `Guided widen · ${era} · archive open.`;
}

export function actFeedback(
  action: "watchlist" | "dismiss" | "open",
  title: string,
): string {
  if (action === "watchlist") {
    return `Watchlisted "${title}" - it's in your library now.`;
  }
  if (action === "dismiss") {
    return `Passed on "${title}" - shelf refills without it.`;
  }
  return `Opening "${title}".`;
}

export function actOutcomeWhisper(
  action: "watchlist" | "dismiss" | "open",
  title: string,
): string | null {
  if (action === "watchlist") {
    return `Guided · watchlisted "${title}" · library updated`;
  }
  if (action === "dismiss") {
    return `Guided · passed "${title}" · shelf refilled`;
  }
  return null;
}

export function beatStageLabel(index: number, total: number): string {
  return `${index + 1} of ${total}`;
}

/** Shelf header caption — progressive disclosure by tour stage. */
export function shelfCaption(answeredCount: number, complete: boolean): string {
  if (complete) return "Tonight's three · claim, pass, or re-dial";
  if (answeredCount === 0) return "Preview · answer dials to reshape";
  return "Live · reshuffles with each dial";
}

export function completeGuideLine(): string {
  return "Watchlist or Pass on the shelf. Widen opens the archive — dials stay parked. Deepen lives on the companion.";
}

/**
 * Browse-stage status line (Widen) — booth voice, not packing jargon.
 * Needle progress stays visual; copy names the archive stage + dial band.
 */
export function compactDeskLine(
  _answeredCount: number,
  _total: number,
  eraBand?: string | null,
): string {
  if (eraBand) return `Guided · archive · ${eraBand}`;
  return "Guided · archive open";
}

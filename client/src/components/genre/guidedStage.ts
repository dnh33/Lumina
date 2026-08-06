/**
 * Guided HUD stage machine (Mode-split B Wave 2).
 * One primary surface per stage — flip Self↔Guided re-stages; never stack cockpits.
 *
 * SEED → DIAL → CLAIM → (DEEPEN) → BROWSE
 */

export type GuidedHudStage = "seed" | "dial" | "claim" | "deepen" | "browse";

export interface DeriveGuidedStageArgs {
  /** Library / niche empty path — affinity seed before dials. */
  isSeedWorld: boolean;
  answeredCount: number;
  totalBeats: number;
  status: "active" | "complete" | "abandoned";
  /** User unlocked Widen → Guided browse tray (still in Guided mode). */
  widenBrowse: boolean;
  /** Companion opened after claim (optional deepen). */
  deepenOpen?: boolean;
}

/**
 * Derive the active Guided HUD stage from session + widen flag.
 * Parent parks Self browse unless stage === browse (or Self mode).
 */
export function deriveGuidedStage(args: DeriveGuidedStageArgs): GuidedHudStage {
  if (args.widenBrowse) return "browse";
  if (args.isSeedWorld && args.answeredCount === 0) return "seed";
  if (args.status === "complete" && args.answeredCount >= args.totalBeats) {
    if (args.deepenOpen) return "deepen";
    return "claim";
  }
  return "dial";
}

/** Claim cockpit owns V1 — park Self warehouse / steer / timeline. */
export function isClaimCockpitStage(stage: GuidedHudStage): boolean {
  return stage === "seed" || stage === "dial" || stage === "claim" || stage === "deepen";
}

/** Guided era dial choice ids — matches server rankForGuided bands. */
export type EraBandId = "classic" | "turn" | "now";

/** Era band label for whisper honesty (dial owns era during Dial/Claim). */
export function eraBandLabel(
  eraChoiceId: string | undefined,
): string | null {
  if (eraChoiceId === "classic") return "Classic band";
  if (eraChoiceId === "turn") return "Turn band";
  if (eraChoiceId === "now") return "Now band";
  return null;
}

/**
 * Guided era dial → year band (matches server rankForGuided).
 * classic <1990 · turn 1990–2009 · now ≥2010.
 */
export function yearMatchesEraBand(
  year: number | null | undefined,
  eraChoiceId: string | undefined,
): boolean {
  if (year == null || !eraChoiceId) return true;
  if (eraChoiceId === "classic") return year < 1990;
  if (eraChoiceId === "turn") return year >= 1990 && year <= 2009;
  if (eraChoiceId === "now") return year >= 2010;
  return true;
}

/**
 * Self decade scrub → Guided era dial band.
 * Decade is the scrub start year (1980 = 1980s).
 * classic <1990 · turn 1990–2009 · now ≥2010.
 */
export function eraBandFromDecade(
  decade: number | null | undefined,
): EraBandId | undefined {
  if (decade == null || !Number.isFinite(decade) || decade <= 0) {
    return undefined;
  }
  if (decade < 1990) return "classic";
  if (decade < 2010) return "turn";
  return "now";
}

/**
 * Session dial answer wins; Self decade preferred only fills when unanswered.
 * Never overwrites a completed / retuned era answer.
 */
export function resolveGuidedEraChoice(args: {
  sessionEra: string | undefined;
  preferredFromSelf: EraBandId | undefined;
}): string | undefined {
  return args.sessionEra ?? args.preferredFromSelf;
}

/** Titles inside the dial era band — Guided Widen tray axis source. */
export function filterItemsToEraBand<T extends { year?: number | null }>(
  items: T[],
  eraChoiceId: string | undefined,
): T[] {
  if (!eraChoiceId) return items;
  const banded = items.filter((it) => yearMatchesEraBand(it.year, eraChoiceId));
  return banded.length > 0 ? banded : items;
}

/** Short dial name for Self-flip announce (Classic / Turn / Now). */
export function eraDialShortName(
  eraChoiceId: string | undefined,
): string | null {
  if (eraChoiceId === "classic") return "Classic";
  if (eraChoiceId === "turn") return "Turn";
  if (eraChoiceId === "now") return "Now";
  return null;
}

/**
 * Hub / map enter path — Self cold browse.
 * Explicit `mode=self` so Enter never inherits a silent Guided resume.
 */
export function genreSelfEnterPath(slug: string): string {
  return `/genre/${slug}?mode=self`;
}

/**
 * Hub Resume chip — explicit Guided re-entry.
 * Never used by Enter; cold Enter stays Self.
 * Pass mediaType when the tour progressed on TV (or non-default axis).
 */
export function genreGuidedResumePath(
  slug: string,
  mediaType: "movie" | "tv" = "movie",
): string {
  const base = `/genre/${slug}?mode=guided`;
  return mediaType === "tv" ? `${base}&mediaType=tv` : base;
}

/**
 * Self decade → Guided preferred era band (URL/resume entry + mode strip).
 * Session answers.era still wins via resolveGuidedEraChoice.
 */
export function preferredEraOnGuidedEnter(args: {
  decade: number | null | undefined;
  lastSelfDecade?: number | null | undefined;
}): EraBandId | undefined {
  return eraBandFromDecade(args.decade ?? args.lastSelfDecade ?? null);
}

/**
 * True when a guided session has real progress (not a fresh getOrCreate shell).
 * Hub Resume chip gates on this — empty active rows stay hidden.
 */
export function hasGuidedSessionProgress(session: {
  status: "active" | "complete" | "abandoned";
  answers: Partial<Record<string, string>>;
  acted: unknown[];
}): boolean {
  if (session.status === "complete") return true;
  if (Object.keys(session.answers).length > 0) return true;
  if (session.acted.length > 0) return true;
  return false;
}

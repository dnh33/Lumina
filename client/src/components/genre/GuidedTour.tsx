import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { poster } from "../../lib/img.js";
import { EASE_OUT_EXPO } from "../../lib/motion.js";
import { playWorldCue } from "../../lib/worldCue.js";
import { getSoundEnabled } from "../../lib/sound.js";
import type { GenreWorld } from "../../lib/genreWorld.js";
import type {
  GuidedBeatId,
  GuidedPick,
  GuidedSessionPayload,
  MediaType,
} from "../../lib/types.js";
import {
  actFeedback,
  actOutcomeWhisper,
  beatStageLabel,
  compactDeskLine,
  completeGuideLine,
  dialChooseCue,
  dialNoun,
  dialRetuneHint,
  hasSeenResumeWhisper,
  markResumeWhisperSeen,
  nowCue,
  outcomeWhisper,
  rankFeedback,
  resumeLine,
  shelfCaption,
  tourDeskEyebrow,
  tourDeskTitle,
} from "./guidedCurator.js";
import {
  deriveGuidedStage,
  type GuidedHudStage,
} from "./guidedStage.js";
import {
  buildTonightBag,
  libraryWatchlistPath,
} from "./tonightBag.js";

interface Props {
  slug: string;
  mediaType: MediaType;
  world: GenreWorld;
  /** Apply an era beat to the world's decade scrub (bidirectional steer). */
  onSteerEra?: (decade: number | null) => void;
  onOpenTitle?: (pick: GuidedPick) => void;
  /**
   * Page-level outcome cue for WhisperStrip / sibling chrome.
   * Null clears; GuidedTour owns timing.
   */
  onOutcomeCue?: (cue: string | null) => void;
  /** Niche / empty world - SEED stage (no dial sheet). */
  isSeedWorld?: boolean;
  /**
   * Orchestrator widen flag - collapses desk to browse status bar (BROWSE).
   * Mode flip Self↔Guided should reset this (re-stage).
   */
  compact?: boolean;
  /** Inside claim-stage lacquer — no second outer border. */
  embedded?: boolean;
  /** Dial era band label for Widen browse status honesty. */
  eraBand?: string | null;
  /**
   * Self decade → preferred era choice when dial unanswered (Self→Guided).
   * Does not override session.answers.era.
   */
  preferredEraBand?: string | null;
  /** Unlock Guided BROWSE without leaving Guided mode. */
  onWiden?: () => void;
  /** Return from Widen browse bar to full claim desk. */
  onCollapseWiden?: () => void;
  /** Companion FAB open — derive deepen after complete (widen still wins). */
  deepenOpen?: boolean;
  /** Seam: parent parks Self browse when claim-cockpit stage. */
  onStageChange?: (stage: GuidedHudStage) => void;
  /**
   * Roast2 P0: one-line thesis for the shelf lead — collapses Featured into
   * the lead card so claim fold stays claim-only (no second primary).
   */
  leadThesis?: string | null;
  /**
   * Parked argue body (GenreModules claim-argue-park). Wrapped in closed
   * “Argue this pick” on claim; open on deepen.
   */
  children?: ReactNode;
}

/**
 * Era beat → decade scrub.
 * Ranking uses year *bands* (classic <1990, turn 1990–2009, now ≥2010).
 * Pinning a single decade (e.g. Now → 2010s) filtered the rail to 2010–2019
 * while the Tonight shelf still surfaced 2020s — mismatch. Clear scrub so
 * ranking owns the band; user can still zoom a decade manually.
 */
const ERA_DECADE: Record<string, number | null> = {
  classic: null,
  turn: null,
  now: null,
};

const FEEDBACK_MS = 4200;
const OUTCOME_CUE_MS = 5200;

/**
 * Guided claim cockpit - pause-menu density, Lumina booth chrome.
 * Stages SEED → DIAL → CLAIM → (DEEPEN) → BROWSE. compact = browse status bar.
 */
export function GuidedTour({
  slug,
  mediaType,
  world,
  onSteerEra,
  onOpenTitle,
  onOutcomeCue,
  isSeedWorld = false,
  compact = false,
  embedded = false,
  eraBand = null,
  preferredEraBand = null,
  onWiden,
  onCollapseWiden,
  deepenOpen = false,
  onStageChange,
  leadThesis = null,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shelfPulse, setShelfPulse] = useState(0);
  const [outcomePulse, setOutcomePulse] = useState(0);
  /** Shelf action rhythm — Watchlist/Pass on active cell only (lead default). */
  const [shelfActiveKey, setShelfActiveKey] = useState<string | null>(null);
  /** Re-open a prior dial without full Retake. */
  const [editingBeatId, setEditingBeatId] = useState<GuidedBeatId | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outcomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deskRef = useRef<HTMLElement>(null);
  const prevAnsweredRef = useRef(0);
  const lastStage = useRef<GuidedHudStage | null>(null);
  /** Resume whisper only on first session land per world — not after live answers. */
  const resumeHydratedKey = useRef<string | null>(null);
  /** Stay-on-shelf dismisses the Tonight bag until the bag grows again. */
  const [bagDismissed, setBagDismissed] = useState(false);
  const prevBagLen = useRef(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["guided-session", slug, mediaType],
    queryFn: () => api.guidedSession(slug, mediaType),
  });

  const flash = (msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  const pushOutcomeCue = (cue: string | null) => {
    if (outcomeTimer.current) clearTimeout(outcomeTimer.current);
    onOutcomeCue?.(cue);
    if (cue) {
      setOutcomePulse((n) => n + 1);
      outcomeTimer.current = setTimeout(() => onOutcomeCue?.(null), OUTCOME_CUE_MS);
    }
  };

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (outcomeTimer.current) clearTimeout(outcomeTimer.current);
      onOutcomeCue?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, []);

  // Once-per-browser-session resume whisper (sessionStorage gate).
  // Gate on first hydrate per world so a live answer (0→1) does not overwrite
  // rank feedback with "Resuming…". Skip flash on Widen — browse-bar owns
  // the honest archive stage line (resume must not steal that cue slot).
  useEffect(() => {
    if (!data) return;
    const key = `${slug}:${mediaType}`;
    if (resumeHydratedKey.current === key) return;
    resumeHydratedKey.current = key;
    if (hasSeenResumeWhisper(slug, mediaType)) return;
    const answered = data.beats.filter((b) => data.session.answers[b.id]).length;
    const line = resumeLine(answered, data.beats.length, data.session.status);
    if (!line) return;
    markResumeWhisperSeen(slug, mediaType);
    if (compact) return;
    flash(line);
  }, [data, slug, mediaType, compact]);

  // Era answers rank by year-band, not a single decade. Clear any leftover
  // scrub pin (older Now→2010s behavior) so shelf / Featured / rail agree.
  useEffect(() => {
    if (!data?.session.answers.era) return;
    onSteerEra?.(null);
    // Intentionally omit onSteerEra from deps — parent setDecade is stable enough;
    // we only re-clear when the era answer identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.session.answers.era, slug, mediaType]);

  // After a dial lands, restore focus into the next choice set or claim complete
  // so keyboard users are not dumped to body when the active panel remounts.
  useEffect(() => {
    if (!data) return;
    const answered = data.beats.filter((b) => data.session.answers[b.id]).length;
    if (answered === prevAnsweredRef.current) return;
    prevAnsweredRef.current = answered;
    const id = window.requestAnimationFrame(() => {
      const root = deskRef.current;
      if (!root) return;
      const nextChoice = root.querySelector<HTMLElement>(
        '[data-testid="guided-active-dial"] [role="radio"], [data-testid="guided-active-dial"] button',
      );
      if (nextChoice) {
        nextChoice.focus();
        return;
      }
      const complete = root.querySelector<HTMLElement>('[data-testid="guided-complete"]');
      complete?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [data]);

  // Re-open Tonight bag when a new watchlist act grows the bag.
  useEffect(() => {
    if (!data) return;
    const ids = data.session.acted
      .filter((a) => a.action === "watchlist")
      .map((a) => a.tmdbId);
    const len = buildTonightBag(data.session.picks, ids).length;
    if (len > prevBagLen.current) setBagDismissed(false);
    prevBagLen.current = len;
  }, [data]);

  const applyGuidedSession = (payload: GuidedSessionPayload) => {
    qc.setQueryData<GuidedSessionPayload>(
      ["guided-session", slug, mediaType],
      payload,
    );
    const pickKeys = new Set(
      payload.session.picks.map((p) => `${p.mediaType}:${p.tmdbId}`),
    );
    setShelfActiveKey((prev) => (prev && pickKeys.has(prev) ? prev : null));
  };

  const invalidateWorld = () => {
    void qc.invalidateQueries({ queryKey: ["guided-session", slug, mediaType] });
    void qc.invalidateQueries({ queryKey: ["genre-experience", slug, "guided", mediaType] });
    void qc.invalidateQueries({ queryKey: ["genre-intro", slug, "guided", mediaType] });
  };

  /**
   * Dial answers only persist choices — shelf reweight lives in
   * genre-experience (`refreshGuidedPicks`). Parallel invalidate races:
   * guided-session can refetch BEFORE picks persist, leaving stale peers
   * that fail act with 400. Sequence: rail first, then session picks.
   */
  const syncShelfAfterDial = async (payload: GuidedSessionPayload) => {
    applyGuidedSession(payload);
    await qc.fetchQuery({
      queryKey: ["genre-experience", slug, "guided", mediaType],
      queryFn: () =>
        api.genreExperience([slug], "guided", mediaType, world.modules),
    });
    const fresh = await api.guidedSession(slug, mediaType);
    applyGuidedSession({
      ...payload,
      session: {
        ...payload.session,
        picks: fresh.session.picks,
        updatedAt: fresh.session.updatedAt,
      },
    });
    void qc.invalidateQueries({
      queryKey: ["genre-intro", slug, "guided", mediaType],
    });
  };

  const answerMut = useMutation({
    mutationFn: (args: { beatId: GuidedBeatId; choiceId: string; choiceLabel: string }) =>
      api.answerGuided({
        slug,
        mediaType,
        beatId: args.beatId,
        choiceId: args.choiceId,
      }),
    onSuccess: async (payload, vars) => {
      setEditingBeatId(null);
      await syncShelfAfterDial(payload);
      setShelfPulse((n) => n + 1);
      flash(rankFeedback(vars.beatId, vars.choiceLabel));
      pushOutcomeCue(outcomeWhisper(vars.beatId, vars.choiceLabel));
      if (getSoundEnabled()) playWorldCue(world, "discover");
      if (vars.beatId === "era" && onSteerEra) {
        onSteerEra(ERA_DECADE[vars.choiceId] ?? null);
      }
    },
  });

  const actMut = useMutation({
    mutationFn: (args: {
      tmdbId: number;
      titleMediaType: MediaType;
      action: "watchlist" | "dismiss" | "open";
      title?: string;
      year?: number | null;
      posterPath?: string | null;
    }) => api.guidedAct({ slug, mediaType, ...args }),
    onSuccess: (payload, vars) => {
      applyGuidedSession(payload);
      void qc.invalidateQueries({
        queryKey: ["genre-experience", slug, "guided", mediaType],
      });
      void qc.invalidateQueries({
        queryKey: ["genre-intro", slug, "guided", mediaType],
      });
      setShelfPulse((n) => n + 1);
      flash(actFeedback(vars.action, vars.title ?? "Title"));
      const cue = actOutcomeWhisper(vars.action, vars.title ?? "Title");
      if (cue) pushOutcomeCue(cue);
      if (vars.action === "watchlist" && getSoundEnabled()) {
        playWorldCue(world, "discover");
      }
    },
  });

  const resetMut = useMutation({
    mutationFn: () => api.resetGuided({ slug, mediaType }),
    onSuccess: (payload) => {
      setEditingBeatId(null);
      applyGuidedSession(payload);
      invalidateWorld();
      onSteerEra?.(null);
      flash("Tour reframed - dials cleared, shelf waiting.");
      pushOutcomeCue("Guided · tour reset · shelf preview again");
      onCollapseWiden?.();
    },
  });

  // Stage derived before early returns so onStageChange stays hook-safe.
  const answeredCount = data
    ? data.beats.filter((b) => data.session.answers[b.id]).length
    : 0;
  const stage: GuidedHudStage = data
    ? deriveGuidedStage({
        isSeedWorld,
        answeredCount,
        totalBeats: data.beats.length,
        status: data.session.status,
        widenBrowse: compact,
        deepenOpen,
      })
    : "dial";

  useEffect(() => {
    if (!data) return;
    if (lastStage.current === stage) return;
    lastStage.current = stage;
    onStageChange?.(stage);
  }, [data, stage, onStageChange]);

  if (isLoading) {
    return (
      <section
        aria-label="Guided tour loading"
        data-guided-pack="loading"
        className={
          embedded
            ? "relative overflow-hidden p-4"
            : "reg-ticks relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/50 p-4"
        }
      >
        <div aria-hidden className="film-grain opacity-40" />
        <div className="relative z-10">
          <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-14 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section
        role="alert"
        data-guided-pack="error"
        className={
          embedded
            ? "p-4 text-sm text-mist-300"
            : "rounded-2xl border border-white/[0.06] bg-ink-850/50 p-4 text-sm text-mist-300"
        }
      >
        Tour desk unavailable. Stay in Self mode, or retry Guided.
      </section>
    );
  }

  const { session, beats } = data;
  const nextBeat = beats.find((b) => !session.answers[b.id]);
  const editingBeat = editingBeatId
    ? beats.find((b) => b.id === editingBeatId)
    : undefined;
  const activeBeat = editingBeat ?? nextBeat;
  const activeBeatIndex = activeBeat
    ? beats.findIndex((b) => b.id === activeBeat.id)
    : -1;
  const isReDial = Boolean(editingBeat && session.answers[editingBeat.id]);
  const needlePct = Math.round((answeredCount / Math.max(beats.length, 1)) * 100);
  const watchlisted = session.acted.filter((a) => a.action === "watchlist").length;
  const passed = session.acted.filter((a) => a.action === "dismiss").length;
  const isComplete = session.status === "complete";
  const shelfIsPreview = answeredCount === 0 && !isComplete;
  const showActiveDial = Boolean(activeBeat) && (stage === "dial" || isReDial);
  const showShelf =
    session.picks.length > 0 || watchlisted > 0 || passed > 0;
  const shelfIsHero = stage === "claim" || stage === "deepen";
  const actedWatchlistIds = session.acted
    .filter((a) => a.action === "watchlist")
    .map((a) => a.tmdbId);
  const tonightBag = buildTonightBag(session.picks, actedWatchlistIds);
  const showTonightBag =
    shelfIsHero && tonightBag.length > 0 && !bagDismissed;
  const leadShelfKey =
    session.picks[0] != null
      ? `${session.picks[0].mediaType}:${session.picks[0].tmdbId}`
      : null;
  const resolvedShelfActive =
    shelfActiveKey &&
    session.picks.some((p) => `${p.mediaType}:${p.tmdbId}` === shelfActiveKey)
      ? shelfActiveKey
      : leadShelfKey;

  const renderShelfPick = (
    pick: GuidedPick,
    pi: number,
    opts: { showThesis?: boolean },
  ) => {
    const pickKey = `${pick.mediaType}:${pick.tmdbId}`;
    const src = poster(pick.posterPath, "w185");
    const actionsOpen = resolvedShelfActive === pickKey;
    return (
      <motion.li
        key={pickKey}
        data-shelf-active={actionsOpen ? "1" : "0"}
        data-testid={actionsOpen ? "shelf-cell-active" : undefined}
        onMouseEnter={() => setShelfActiveKey(pickKey)}
        onFocusCapture={() => setShelfActiveKey(pickKey)}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: reduceMotion ? 0 : pi * 0.04,
          ease: EASE_OUT_EXPO,
        }}
        className="flex flex-col gap-1.5"
      >
        <button
          type="button"
          className="group flex gap-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
          onClick={() => {
            // Activate only — hover/default-lead already marks actionsOpen, so a
            // second-tap-to-open path would navigate on the first real click.
            // Explicit "Open" action owns navigation.
            setShelfActiveKey(pickKey);
          }}
        >
          <span
            className={`relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md bg-ink-900 ring-1 transition-[box-shadow,ring-color] duration-200 ${
              actionsOpen
                ? "ring-[color-mix(in_oklab,var(--world-accent)_45%,transparent)]"
                : "ring-white/10"
            }`}
          >
            {src ? (
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-2xs text-mist-600">
                -
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm text-mist-100">
              {pick.title}
            </span>
            <span className="text-2xs text-mist-500">
              {pick.year ?? "-"}
              {pick.inLibrary ? " · already in library" : ""}
            </span>
            {opts.showThesis && pi === 0 && leadThesis ? (
              <span
                data-testid="shelf-lead-thesis"
                className="mt-1 block text-2xs leading-snug text-mist-300"
              >
                {leadThesis.length > 140
                  ? `${leadThesis.slice(0, 137)}…`
                  : leadThesis}
              </span>
            ) : null}
          </span>
        </button>
        {/* A1.4: one primary verb on the active cell — siblings stay art-led. */}
        {actionsOpen ? (
          <div
            data-testid="shelf-cell-actions"
            className="mt-auto flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              disabled={actMut.isPending || pick.inLibrary}
              aria-label={
                pick.inLibrary
                  ? `${pick.title} already in library`
                  : `Add ${pick.title} to watchlist`
              }
              onClick={() =>
                actMut.mutate({
                  tmdbId: pick.tmdbId,
                  titleMediaType: pick.mediaType,
                  action: "watchlist",
                  title: pick.title,
                  year: pick.year,
                  posterPath: pick.posterPath,
                })
              }
              className="world-accent-fill rounded-lg px-2.5 py-1.5 text-2xs font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
            >
              {pick.inLibrary ? "In library" : "Watchlist"}
            </button>
            <button
              type="button"
              disabled={actMut.isPending}
              aria-label={`Open ${pick.title}`}
              onClick={() => {
                actMut.mutate({
                  tmdbId: pick.tmdbId,
                  titleMediaType: pick.mediaType,
                  action: "open",
                  title: pick.title,
                  year: pick.year,
                  posterPath: pick.posterPath,
                });
                onOpenTitle?.(pick);
              }}
              className="rounded-md px-1 py-1.5 text-2xs font-medium text-mist-400 transition-colors hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
            >
              Open
            </button>
            <button
              type="button"
              disabled={actMut.isPending}
              aria-label={`Pass on ${pick.title} - not tonight`}
              onClick={() =>
                actMut.mutate({
                  tmdbId: pick.tmdbId,
                  titleMediaType: pick.mediaType,
                  action: "dismiss",
                  title: pick.title,
                })
              }
              className="rounded-md px-1 py-1.5 text-2xs font-medium text-mist-500 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
            >
              Pass
            </button>
          </div>
        ) : null}
      </motion.li>
    );
  };

  const guidanceLine =
    feedback ??
    nowCue({
      answeredCount,
      total: beats.length,
      nextBeatId: nextBeat?.id,
      status: session.status,
      isReDial,
      reDialId: editingBeat?.id,
    });

  const handleNeedleClick = (beatId: GuidedBeatId) => {
    if (!session.answers[beatId]) return;
    setEditingBeatId((cur) => (cur === beatId ? null : beatId));
  };

  // BROWSE status bar: thin recall (stage · Retake · Back to shelf) — not Claim leftovers.
  // Honest archive stage always — resume / dial flashes stay on claim desk only.
  if (compact) {
    const stageLine = compactDeskLine(answeredCount, beats.length, eraBand);
    return (
      <section
        aria-label="Guided archive browse"
        data-testid="guided-tour"
        data-guided-stage="browse"
        data-guided-pack="browse-bar"
        data-guided-answered={answeredCount}
        style={{ ["--world-accent" as any]: world.register.accent }}
        className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-white/[0.06] px-0.5 py-2"
      >
        <p
          data-testid="guided-browse-stage"
          className="min-w-0 flex-1 truncate text-2xs font-medium tracking-wide text-mist-200"
        >
          {stageLine}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={() => resetMut.mutate()}
              disabled={resetMut.isPending}
              className="text-2xs font-medium uppercase tracking-wider text-mist-500 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
            >
              Retake
            </button>
          )}
          <button
            type="button"
            data-testid="guided-collapse-widen"
            onClick={() => onCollapseWiden?.()}
            className="rounded-md bg-[var(--world-accent,#e8b84b)]/90 px-2.5 py-1 text-2xs font-semibold text-ink-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
          >
            Back to shelf
          </button>
        </div>
      </section>
    );
  }

  // SEED: quiet desk - empty affinity; dial sheet waits.
  if (stage === "seed") {
    return (
      <section
        aria-label="Guided tour seed"
        data-testid="guided-tour"
        data-guided-stage="seed"
        data-guided-pack="claim-cockpit"
        data-guided-answered={0}
        data-guided-embedded={embedded ? "1" : "0"}
        style={{ ["--world-accent" as any]: world.register.accent }}
        className={
          embedded
            ? "relative overflow-hidden p-4"
            : "reg-ticks relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/60 p-4"
        }
      >
        <div aria-hidden className="film-grain opacity-40" />
        <div className="relative z-10 space-y-2">
          <p className="text-xs tracking-tight text-mist-300">{tourDeskEyebrow(world)}</p>
          <h1 className="font-display text-lg font-semibold text-mist-100">
            Seed the room first
          </h1>
          <p className="text-2xs text-mist-300" data-testid="guided-feedback">
            Affinity titles open the dials. Tour desk waits until the shelf has ground truth.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={deskRef}
      aria-label="Guided tour"
      data-testid="guided-tour"
      data-guided-stage={stage}
      data-guided-pack="claim-cockpit"
      data-guided-answered={answeredCount}
      data-guided-outcome-pulse={outcomePulse}
      data-guided-embedded={embedded ? "1" : "0"}
      style={{ ["--world-accent" as any]: world.register.accent }}
      className={
        embedded
          ? "relative overflow-hidden p-4 pb-14 sm:p-5 sm:pb-16"
          : "reg-ticks relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/60 p-4 pb-14 sm:p-5 sm:pb-16"
      }
    >
      {/* pb clears docked Companion FAB / DEEPEN HUD (320×380) - do not expand desk into that corner */}
      {!embedded && <div aria-hidden className="film-grain opacity-40" />}
      <div className="relative z-10 space-y-3.5">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs tracking-tight text-mist-300">{tourDeskEyebrow(world)}</p>
            <h1 className="mt-0.5 font-display text-lg font-semibold text-mist-100 sm:text-xl">
              {tourDeskTitle(world, session.status)}
            </h1>
          </div>
          {answeredCount > 0 && (
            <button
              type="button"
              onClick={() => resetMut.mutate()}
              disabled={resetMut.isPending}
              className="text-2xs font-medium uppercase tracking-wider text-mist-500 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
            >
              Retake
            </button>
          )}
        </header>

        {/* Curator guidance — flash after action, else persistent next-step */}
        <div aria-live="polite" className="min-h-[1.35rem]">
          <AnimatePresence mode="wait">
            <motion.p
              key={guidanceLine}
              data-testid="guided-feedback"
              data-guided-flash={feedback ? "1" : "0"}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className={`text-2xs font-medium tracking-wide ${
                feedback
                  ? "text-[var(--world-accent,#e8b84b)]"
                  : "text-mist-300"
              }`}
            >
              {guidanceLine}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tour needle — answered ticks re-open; next dial gets Up next */}
        <div className="space-y-2">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={needlePct}
            aria-label={`Tour progress ${answeredCount} of ${beats.length}`}
            className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--world-accent,#e8b84b)]"
              initial={false}
              animate={{ width: `${needlePct}%` }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.45, ease: EASE_OUT_EXPO }
              }
            />
          </div>
          <ol className="grid grid-cols-3 gap-2" aria-label="Tour beats">
            {beats.map((beat, i) => {
              const chosen = session.answers[beat.id];
              const choice = beat.choices.find((c) => c.id === chosen);
              const isNext = !editingBeatId && nextBeat?.id === beat.id;
              const isEditing = editingBeatId === beat.id;
              const tickClass = chosen
                ? "bg-[var(--world-accent,#e8b84b)]"
                : isNext || isEditing
                  ? "bg-white/35"
                  : "bg-white/10";
              const labelClass = chosen || isEditing
                ? "text-[var(--world-accent,#e8b84b)]"
                : isNext
                  ? "text-mist-100"
                  : "text-mist-500";

              if (chosen) {
                return (
                  <li key={beat.id} className="min-w-0">
                    <button
                      type="button"
                      data-testid={`guided-dial-${beat.id}`}
                      aria-pressed={isEditing}
                      aria-expanded={isEditing}
                      aria-controls={isEditing ? "guided-active-dial" : undefined}
                      aria-label={`${dialNoun(beat.id)} dial · ${choice?.label ?? chosen}. ${
                        isEditing
                          ? "Choices open — pick a radio to retune"
                          : "Tap to open choices, then pick a setting"
                      }`}
                      onClick={() => handleNeedleClick(beat.id)}
                      className={`w-full rounded-md text-left transition-colors hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                        isEditing
                          ? "bg-[var(--world-accent,#e8b84b)]/[0.07] ring-1 ring-[var(--world-accent,#e8b84b)]/35"
                          : ""
                      }`}
                    >
                      <div className={`mb-1.5 h-0.5 w-full rounded-full ${tickClass}`} />
                      <p className={`truncate text-2xs font-medium ${labelClass}`}>
                        {choice ? choice.label : dialNoun(beat.id)}
                      </p>
                      <p
                        data-testid={`guided-dial-hint-${beat.id}`}
                        className={`truncate text-[0.65rem] uppercase tracking-wider ${
                          isEditing
                            ? "text-[var(--world-accent,#e8b84b)]"
                            : "text-mist-500"
                        }`}
                      >
                        {dialRetuneHint(isEditing)}
                      </p>
                    </button>
                  </li>
                );
              }

              return (
                <li key={beat.id} className="min-w-0">
                  <div
                    className={`mb-1.5 h-0.5 w-full rounded-full transition-colors ${tickClass}`}
                  />
                  <p className={`truncate text-2xs font-medium ${labelClass}`}>
                    {dialNoun(beat.id)}
                  </p>
                  <p className="truncate text-[0.65rem] uppercase tracking-wider text-mist-600">
                    {isNext ? "Up next" : beatStageLabel(i, beats.length)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Dial sheet sits under the needle — claim retune must not hide radios below shelf. */}
        <AnimatePresence mode="wait">
          {showActiveDial && activeBeat && (
            <motion.div
              key={`${activeBeat.id}:${isReDial ? "edit" : "next"}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              id="guided-active-dial"
              className={`space-y-2.5 border-t pt-3 ${
                isReDial
                  ? "border-[var(--world-accent,#e8b84b)]/40"
                  : "border-white/[0.06]"
              }`}
              data-testid="guided-active-dial"
              data-guided-dial-mode={isReDial ? "retune" : "set"}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-2xs uppercase tracking-wider text-mist-500">
                  {isReDial
                    ? `Re-dial · ${dialNoun(activeBeat.id)}`
                    : `${dialNoun(activeBeat.id)} · ${beatStageLabel(activeBeatIndex, beats.length)}`}
                </p>
                {isReDial && (
                  <button
                    type="button"
                    onClick={() => setEditingBeatId(null)}
                    className="text-2xs text-mist-500 underline-offset-2 hover:text-mist-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <p className="font-sans text-sm text-mist-200">{activeBeat.prompt}</p>
              <p
                id="guided-dial-choose-cue"
                data-testid="guided-dial-choose-cue"
                className="text-2xs font-medium tracking-wide text-[var(--world-accent,#e8b84b)]/90"
              >
                {dialChooseCue(activeBeat.id, isReDial)}
              </p>
              <div
                className="grid gap-2 sm:grid-cols-3"
                role="radiogroup"
                aria-label={`${activeBeat.prompt} — choose one`}
                aria-describedby="guided-dial-choose-cue"
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                  const radios = Array.from(
                    e.currentTarget.querySelectorAll<HTMLElement>(
                      '[role="radio"]:not([disabled])',
                    ),
                  );
                  if (radios.length === 0) return;
                  const idx = radios.indexOf(e.target as HTMLElement);
                  if (idx < 0) return;
                  let next = idx;
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    next = (idx + 1) % radios.length;
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    next = (idx - 1 + radios.length) % radios.length;
                  } else if (e.key === "Home") {
                    next = 0;
                  } else if (e.key === "End") {
                    next = radios.length - 1;
                  } else {
                    return;
                  }
                  e.preventDefault();
                  const target = radios[next];
                  target?.focus();
                  target?.click();
                }}
              >
                {activeBeat.choices.map((choice, ci) => {
                  const selected = session.answers[activeBeat.id] === choice.id;
                  const checkedIdx = activeBeat.choices.findIndex(
                    (c) => session.answers[activeBeat.id] === c.id,
                  );
                  const preferredIdx =
                    activeBeat.id === "era" &&
                    !session.answers.era &&
                    preferredEraBand
                      ? activeBeat.choices.findIndex(
                          (c) => c.id === preferredEraBand,
                        )
                      : -1;
                  const tabStop =
                    checkedIdx >= 0
                      ? ci === checkedIdx
                      : preferredIdx >= 0
                        ? ci === preferredIdx
                        : ci === 0;
                  return (
                    <motion.button
                      key={choice.id}
                      type="button"
                      role="radio"
                      disabled={answerMut.isPending}
                      aria-checked={selected}
                      tabIndex={tabStop ? 0 : -1}
                      data-selected={selected ? "true" : "false"}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: reduceMotion ? 0 : 0.04 + ci * 0.05,
                        ease: EASE_OUT_EXPO,
                      }}
                      onClick={() =>
                        answerMut.mutate({
                          beatId: activeBeat.id,
                          choiceId: choice.id,
                          choiceLabel: choice.label,
                        })
                      }
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] active:scale-[0.98] ${
                        selected
                          ? "border-[var(--world-accent,#e8b84b)]/55 bg-[var(--world-accent,#e8b84b)]/10 ring-1 ring-[var(--world-accent,#e8b84b)]/30"
                          : "border-white/[0.08] bg-white/[0.03] hover:border-[var(--world-accent,#e8b84b)]/40 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="block font-display text-sm font-medium text-mist-100">
                          {choice.label}
                        </span>
                        {selected ? (
                          <span className="shrink-0 text-[0.65rem] uppercase tracking-wider text-[var(--world-accent,#e8b84b)]">
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-2xs text-mist-500">{choice.hint}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CLAIM: shelf hero after dial sheet. DIAL: muted preview after choices. */}
        {shelfIsHero && showShelf && (
          <div
            className="space-y-2.5 border-t border-white/[0.06] pt-3"
            data-testid="guided-shelf"
            data-guided-shelf="live"
            data-guided-shelf-role="hero"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-mist-100">
                Tonight shelf
              </h3>
              <p className="text-2xs text-mist-500">
                {watchlisted > 0 && (
                  <span>
                    {watchlisted} watchlisted
                    {passed > 0 ? " · " : ""}
                  </span>
                )}
                {passed > 0 && <span>{passed} passed</span>}
                {watchlisted === 0 && passed === 0 && (
                  <span>{shelfCaption(answeredCount, isComplete)}</span>
                )}
              </p>
            </div>
            <motion.ul
              key={`claim-${shelfPulse}`}
              className="grid gap-3 sm:grid-cols-3 sm:gap-4"
              initial={reduceMotion ? false : { opacity: 0.55 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {session.picks.map((pick, pi) =>
                renderShelfPick(pick, pi, { showThesis: true }),
              )}
            </motion.ul>
            {showTonightBag ? (
              <div
                data-testid="tonight-bag"
                className="mt-2.5 space-y-2 border-t border-white/[0.06] pt-2.5"
                aria-label="Tonight bag"
              >
                <p className="text-2xs font-medium tracking-wide text-mist-400">
                  Tonight bag
                </p>
                <ul className="flex flex-wrap gap-x-3 gap-y-1">
                  {tonightBag.map((item) => (
                    <li
                      key={`${item.mediaType}:${item.tmdbId}`}
                      className="font-display text-sm text-mist-100"
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={libraryWatchlistPath()}
                    className="world-accent-fill rounded-lg px-2.5 py-1.5 text-2xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
                  >
                    Open in Library
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBagDismissed(true)}
                    className="rounded-md px-1 py-1.5 text-2xs font-medium text-mist-500 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
                  >
                    Stay on shelf
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Roast2 P0: argue parked — closed on claim (not a second primary);
            open by default on deepen. Featured H2 never mounts here. */}
        {shelfIsHero && children ? (
          <details
            key={stage === "deepen" ? "deepen" : "claim"}
            data-testid="guided-claim-argue"
            {...(stage === "deepen" ? { open: true } : {})}
            className="group border-t border-white/[0.06] pt-2.5"
          >
            <summary className="cursor-pointer list-none text-2xs font-medium tracking-wide text-mist-500 marker:content-none transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="text-[var(--world-accent,#e8b84b)] transition-transform group-open:rotate-90"
                >
                  ›
                </span>
                Argue this pick
              </span>
            </summary>
            <div data-testid="guided-claim-inspect" className="mt-2.5 space-y-2">
              {children}
            </div>
          </details>
        ) : null}

        {!shelfIsHero && showShelf && (
          <div
            className={`space-y-2.5 border-t border-white/[0.06] pt-3 transition-opacity duration-300 ${
              shelfIsPreview ? "opacity-70" : "opacity-100"
            }`}
            data-testid="guided-shelf"
            data-guided-shelf={shelfIsPreview ? "preview" : "live"}
            data-guided-shelf-role="preview"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-mist-100">
                Tonight shelf
              </h3>
              <p className="text-2xs text-mist-500">
                {watchlisted > 0 && (
                  <span>
                    {watchlisted} watchlisted
                    {passed > 0 ? " · " : ""}
                  </span>
                )}
                {passed > 0 && <span>{passed} passed</span>}
                {watchlisted === 0 && passed === 0 && (
                  <span>{shelfCaption(answeredCount, isComplete)}</span>
                )}
              </p>
            </div>
            <motion.ul
              key={`dial-${shelfPulse}`}
              className="grid gap-3 sm:grid-cols-3 sm:gap-4"
              initial={reduceMotion ? false : { opacity: 0.55 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {session.picks.map((pick, pi) =>
                renderShelfPick(pick, pi, { showThesis: false }),
              )}
            </motion.ul>
            {session.picks.length === 0 && (watchlisted > 0 || passed > 0) && (
              <p className="text-2xs text-mist-500">
                Shelf empty for now - answer dials or wait for picks to refill.
              </p>
            )}
          </div>
        )}

        {isComplete && !showActiveDial && (
          <div
            className="space-y-3 border-t border-white/[0.06] pt-3"
            data-testid="guided-complete"
            tabIndex={-1}
          >
            <p className="text-2xs text-mist-300">{completeGuideLine()}</p>
            {onWiden && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="guided-desk-widen"
                  onClick={onWiden}
                  aria-label="Widen and browse the archive"
                  className="world-accent-soft rounded-lg px-3 py-2 text-2xs font-semibold tracking-tight text-mist-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent)]"
                >
                  Widen / browse archive
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


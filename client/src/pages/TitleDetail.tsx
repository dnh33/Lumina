import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Heart,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { backdrop, logo, poster, profile } from "../lib/img";
import { playCue } from "../lib/sound";
import { Carousel } from "../components/Carousel";
import { PosterCard } from "../components/PosterCard";
import { CriticsBadge } from "../components/CriticsBadge";
import { Chip, RatingDial } from "../components/Bits";
import { EpisodeTracker } from "../components/EpisodeTracker";
import { InsightBody } from "../components/InsightBody";
import type {
  LibraryEntry,
  LibraryStatus,
  MediaType,
  TitleDetails,
} from "../lib/types";

/* ── Trailer lightbox ───────────────────────────────────────────── */

function TrailerLightbox({
  trailerKey,
  title,
  onClose,
}: {
  trailerKey: string;
  title: string;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      openerRef.current?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/95 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close trailer"
        onClick={onClose}
        className="absolute right-5 top-5 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-mist-200 ring-1 ring-white/20 transition hover:bg-white/[0.15]"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
          title={`${title} trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </motion.div>
  );
}

/* ── AI insight — rail card that expands IN-FLOW into a full-width band ─ */

/** Reserved-height loading skeleton shared by the rail card and the band. */
function InsightSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`${tall ? "min-h-[280px]" : "min-h-[280px]"} space-y-3`} aria-busy="true">
      <div className="h-5 w-24 animate-pulse rounded-full bg-white/10" />
      <div className="h-3 w-full animate-pulse rounded bg-white/10" />
      <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
    </div>
  );
}

const EMPTY_PROFILE_NUDGE =
  "Log a few favorites first — your taste profile is still empty, and Lumina needs signal to read this one well.";

/**
 * Shared query wiring for the take — called by both the rail card and the
 * expanded band; TanStack dedupes on the query key so they see one request.
 * The take is generated ON REQUEST (button), never on page entry — an LLM
 * roundtrip is too heavy to fire as a page side-effect.
 */
function useTitleInsight(details: TitleDetails, requested: boolean) {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const insight = useQuery({
    queryKey: ["insight", details.mediaType, details.tmdbId],
    queryFn: () => api.insight(details.mediaType, details.tmdbId),
    enabled: requested && health.isSuccess && health.data.aiConfigured,
    staleTime: Infinity,
  });
  const refresh = useMutation({
    mutationFn: () => api.insight(details.mediaType, details.tmdbId, true),
    onSuccess: () => insight.refetch(),
  });
  return { health, insight, refresh };
}

/**
 * TakeBand — the take expanded INTO the page flow: a full-width section
 * above the editorial grid (no modal — content simply makes room). Shares
 * layoutId with the rail card so activation reads as the card gliding out
 * of the rail; collapse tucks it back.
 */
function TakeBand({
  details,
  requested,
  onCollapse,
}: {
  details: TitleDetails;
  requested: boolean;
  onCollapse: () => void;
}) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { health, insight, refresh } = useTitleInsight(details, requested);
  const ref = useRef<HTMLElement>(null);
  const onFollowup = useCallback(
    (prefill: string) => navigate("/chat", { state: { prefill } }),
    [navigate],
  );

  // The band mounts from a rail-level action that may sit below the fold —
  // bring it into view so the expansion is never invisible.
  useEffect(() => {
    ref.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [reduceMotion]);

  if (!health.isSuccess || !health.data.aiConfigured) return null;

  const loading = insight.isLoading || refresh.isPending;

  return (
    <motion.section
      ref={ref}
      layoutId="lumina-take"
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="panel mb-8 p-6 ring-gold-400/20 sm:p-8"
      aria-label={`Lumina's take on ${details.title}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-display text-xl font-semibold text-gold-300 sm:text-2xl">
          <Sparkles className="h-5 w-5" /> Lumina's take
        </h3>
        <button
          type="button"
          aria-label="Tuck Lumina's take back into the rail"
          title="Tuck away"
          onClick={onCollapse}
          className="icon-btn"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <InsightSkeleton tall />
      ) : insight.isError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-300/90">
            {(insight.error as Error).message}
          </p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => insight.refetch()}
          >
            Retry
          </button>
        </div>
      ) : insight.data?.profileState === "empty" ? (
        <p className="text-sm leading-relaxed text-mist-400">{EMPTY_PROFILE_NUDGE}</p>
      ) : insight.data ? (
        <InsightBody
          insight={insight.data}
          spacious
          onRegenerate={() => refresh.mutate()}
          onFollowup={onFollowup}
        />
      ) : null}
    </motion.section>
  );
}

function InsightCard({
  details,
  requested,
  expanded,
  onActivate,
  onExpand,
}: {
  details: TitleDetails;
  requested: boolean;
  /** While true the take lives in the TakeBand above — the rail slot empties. */
  expanded: boolean;
  /** First request: generate the take AND expand it into the band. */
  onActivate: () => void;
  /** Re-expand an already-generated take. */
  onExpand: () => void;
}) {
  const navigate = useNavigate();
  const { health, insight, refresh } = useTitleInsight(details, requested);
  // Hooks must run unconditionally (this once sat below an early return —
  // a hooks-order violation that crashed the card once health resolved).
  const onFollowup = useCallback(
    (prefill: string) => navigate("/chat", { state: { prefill } }),
    [navigate],
  );

  // No flash-then-vanish: only render once we know AI is configured.
  if (!health.isSuccess || !health.data.aiConfigured) return null;
  // Expanded → the take has left the rail; the band above renders it.
  if (expanded) return null;

  return (
    <motion.section layoutId="lumina-take" className="panel p-5 ring-gold-400/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-gold-300">
          <Sparkles className="h-[18px] w-[18px]" /> Lumina's take
        </h3>
        {/* Mirrors the band's top-right tuck-away control, same corner. */}
        {insight.data && (
          <button
            type="button"
            aria-label="Expand Lumina's take"
            title="Expand"
            onClick={onExpand}
            className="icon-btn"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {!requested && !insight.data ? (
        <div>
          <p className="mb-4 text-sm leading-relaxed text-mist-400">
            A personal, spoiler-free reflection on whether this fits your
            taste — grounded in your ratings and notes.
          </p>
          <button type="button" onClick={onActivate} className="btn-primary">
            Why would I love this?
          </button>
        </div>
      ) : insight.isLoading || refresh.isPending ? (
        // Reserved-height skeleton: prevents the reflow jump that broke layout.
        <InsightSkeleton />
      ) : insight.isError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-300/90">
            {(insight.error as Error).message}
          </p>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => insight.refetch()}
          >
            Retry
          </button>
        </div>
      ) : insight.data?.profileState === "empty" ? (
        <p className="text-sm leading-relaxed text-mist-400">{EMPTY_PROFILE_NUDGE}</p>
      ) : insight.data ? (
        <InsightBody
          insight={insight.data}
          onRegenerate={() => refresh.mutate()}
          onFollowup={onFollowup}
        />
      ) : null}
    </motion.section>
  );
}

/* ── Previously on… (main column, tv you're resuming) ───────────── */

function RecapCard({ entry }: { entry: LibraryEntry }) {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const [requested, setRequested] = useState(false);
  const recap = useQuery({
    queryKey: ["recap", entry.id],
    queryFn: () => api.recap(entry.id),
    enabled: requested,
    staleTime: Infinity,
  });

  if (!health.isSuccess || !health.data.aiConfigured) return null;

  return (
    <section className="panel max-w-[68ch] p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
          <BookOpen className="h-[18px] w-[18px] text-gold-400" /> Previously on…
        </h3>
      </div>
      {!requested ? (
        <div>
          <p className="mb-4 text-sm leading-relaxed text-mist-400">
            Coming back after a break? Get a spoiler-safe recap built only from
            the episodes you've already seen.
          </p>
          <button type="button" className="btn-ghost" onClick={() => setRequested(true)}>
            Remind me where I was
          </button>
        </div>
      ) : recap.isLoading ? (
        <div className="flex items-center gap-3 py-3 text-sm text-mist-400">
          <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
          Re-reading your watched episodes…
        </div>
      ) : recap.isError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-300/90">{(recap.error as Error).message}</p>
          <button type="button" className="btn-ghost" onClick={() => recap.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <div>
          <p className="font-display text-[1.02rem] leading-relaxed text-mist-200">
            {recap.data?.text || "Nothing watched yet — no recap needed."}
          </p>
          {recap.data?.resumeAt && (
            <p className="mt-3 text-sm font-medium text-gold-300">
              Resume at S{recap.data.resumeAt.season} · E
              {recap.data.resumeAt.episode}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Where to watch (side rail) ─────────────────────────────────── */

function WhereToWatch({ details }: { details: TitleDetails }) {
  const wp = details.watchProviders;
  if (!wp) return null;
  const groups = [
    { label: "Stream", items: wp.flatrate },
    { label: "Rent", items: wp.rent },
    { label: "Buy", items: wp.buy },
  ].filter((g) => g.items.length);
  if (!groups.length) return null;

  return (
    <section className="panel p-5">
      <h3 className="mb-1 font-display text-lg font-semibold text-mist-200">
        Where to watch
      </h3>
      <p className="mb-3 text-2xs uppercase tracking-wider text-mist-400">
        {wp.region} · via JustWatch
      </p>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-mist-400">
              {g.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((p) => (
                <span
                  key={`${g.label}-${p.name}`}
                  title={p.name}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] py-1 pl-1 pr-2.5 text-2xs font-medium text-mist-300 ring-1 ring-white/10"
                >
                  {p.logoPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${p.logoPath}`}
                      alt=""
                      className="h-6 w-6 rounded-md"
                    />
                  ) : null}
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Facts (side rail) ──────────────────────────────────────────── */

function FactsCard({
  details,
  entry,
}: {
  details: TitleDetails;
  entry: LibraryEntry | null;
}) {
  const rows: { label: string; value: ReactNode }[] = [];
  if (details.director) {
    rows.push({
      label: details.mediaType === "tv" ? "Created by" : "Directed by",
      value: details.directorId ? (
        <Link
          to={`/person/${details.directorId}`}
          className="text-gold-300 transition hover:text-gold-400"
        >
          {details.director}
        </Link>
      ) : (
        details.director
      ),
    });
  }
  if (details.releaseDate) {
    rows.push({ label: "Released", value: details.releaseDate });
  }
  if (details.mediaType === "movie" && details.runtime) {
    rows.push({ label: "Runtime", value: `${details.runtime} min` });
  }
  if (details.mediaType === "tv") {
    rows.push({
      label: "Seasons",
      value: `${details.seasonsCount ?? "?"} · ${details.episodesCount ?? "?"} episodes`,
    });
    if (details.status) rows.push({ label: "Status", value: details.status });
  }
  if (details.imdbRating != null || details.rtRating != null || details.voteAverage != null) {
    const parts: ReactNode[] = [];
    if (details.imdbRating != null)
      parts.push(<CriticsBadge key="imdb" source="imdb" score={details.imdbRating} />);
    if (details.rtRating != null)
      parts.push(<CriticsBadge key="rt" source="rt" score={details.rtRating} />);
    if (details.voteAverage != null)
      parts.push(<CriticsBadge key="tmdb" source="tmdb" score={details.voteAverage} />);
    rows.push({
      label: "Critics",
      value: <span className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">{parts}</span>,
    });
  }
  // Your hottest take — you vs the crowd
  if (entry?.rating != null && (details.imdbRating != null || details.rtRating != null || details.voteAverage != null)) {
    const crowd = details.imdbRating ?? (details.rtRating != null ? details.rtRating / 10 : details.voteAverage);
    if (crowd != null) {
      const delta = entry.rating - crowd;
      rows.push({
        label: "You vs the crowd",
        value: (
          <span
            className={`tabular-nums font-medium ${
              Math.abs(delta) >= 2 ? "text-gold-300" : "text-mist-200"
            }`}
          >
            You {entry.rating} · Crowd {crowd.toFixed(1)}
            {Math.abs(delta) >= 2 ? (delta > 0 ? " ↑ bold take" : " ↓ contrarian") : ""}
          </span>
        ),
      });
    }
  }
  if (!rows.length) return null;

  return (
    <section className="panel p-5">
      <h3 className="mb-3 font-display text-lg font-semibold text-mist-200">
        Details
      </h3>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-mist-400">
              {r.label}
            </dt>
            <dd className="text-right text-sm text-mist-200">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Cast (full-width row, links to person pages) ───────────────── */

function CastRow({ details }: { details: TitleDetails }) {
  if (!details.cast.length) return null;
  return (
    <Carousel title="Cast" eyebrow="The faces behind it">
      {details.cast.map((c) => {
        const img = profile(c.profilePath);
        const inner = (
          <>
            <div className="mx-auto mb-2.5 aspect-square w-full overflow-hidden rounded-2xl bg-ink-700 ring-1 ring-white/10 transition duration-300 group-hover/person:ring-gold-400/50 group-hover/person:shadow-[0_10px_32px_-8px_rgba(232,184,75,0.25)]">
              {img ? (
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/person:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-3xl text-mist-400">
                  {c.name[0]}
                </div>
              )}
            </div>
            <p className="truncate text-[0.82rem] font-medium text-mist-200 transition group-hover/person:text-gold-300">
              {c.name}
            </p>
            {c.character && (
              <p className="truncate text-2xs text-mist-400">{c.character}</p>
            )}
          </>
        );
        return c.id ? (
          <Link
            key={`${c.id}-${c.name}`}
            to={`/person/${c.id}`}
            className="group/person w-[124px] shrink-0 text-center sm:w-[136px]"
          >
            {inner}
          </Link>
        ) : (
          <div key={c.name} className="w-[124px] shrink-0 text-center sm:w-[136px]">
            {inner}
          </div>
        );
      })}
    </Carousel>
  );
}

/* ── Full-width action bar (the page's primary task) ────────────── */

function ActionBar({
  details,
  entry,
  onPlayTrailer,
}: {
  details: TitleDetails;
  entry: LibraryEntry | null;
  onPlayTrailer: (() => void) | null;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    setError(null);
    invalidateLibraryData(qc);
  };
  const fail = (e: unknown) => setError((e as Error).message);

  const add = useMutation({
    mutationFn: (status: LibraryStatus) =>
      api.addToLibrary({
        tmdbId: details.tmdbId,
        mediaType: details.mediaType,
        status,
      }),
    // first save is the moment — updates/removes stay on their gesture cues
    onSuccess: () => {
      playCue("success");
      done();
    },
    onError: fail,
  });
  const update = useMutation({
    mutationFn: (patch: Parameters<typeof api.updateEntry>[1]) =>
      api.updateEntry(entry!.id, patch),
    onSuccess: done,
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: () => api.removeEntry(entry!.id),
    onSuccess: () => {
      done();
      navigate("/library");
    },
    onError: fail,
  });

  const trailerButton = onPlayTrailer && (
    <button type="button" onClick={onPlayTrailer} className="btn-ghost">
      <Play className="h-4 w-4 text-gold-400" /> Trailer
    </button>
  );

  return (
    <div className="panel mb-8 p-4 sm:px-5">
      {!entry ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="mr-2 text-sm font-medium text-mist-400">
            Not in your archive yet
          </p>
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate("watched")}
            className="btn-primary"
          >
            {add.isPending && add.variables === "watched" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            I've watched this
          </button>
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate("watchlist")}
            className="btn-ghost"
          >
            {add.isPending && add.variables === "watchlist" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Save to watchlist
          </button>
          {details.mediaType === "tv" && (
            <button
              type="button"
              disabled={add.isPending}
              onClick={() => add.mutate("watching")}
              className="btn-ghost"
            >
              {add.isPending && add.variables === "watching" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Currently watching
            </button>
          )}
          {trailerButton}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
            {(["watched", "watching", "watchlist", "abandoned"] as const).map((s) => (
              <button
                key={s}
                type="button"
                data-cuelume-toggle="toggle"
                onClick={() => update.mutate({ status: s })}
                className={`pill capitalize ${entry.status === s ? "pill-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden />

          <div className="flex items-center gap-2.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-mist-400">
              Your rating
            </span>
            <RatingDial
              value={entry.rating}
              onChange={(v) => update.mutate({ rating: v })}
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {trailerButton}
            <button
              type="button"
              aria-label={entry.favorite ? "Remove favorite" : "Mark favorite"}
              title={entry.favorite ? "Remove favorite" : "Mark favorite"}
              data-cuelume-toggle="toggle"
              onClick={() => update.mutate({ favorite: !entry.favorite })}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl transition ${
                entry.favorite
                  ? "bg-gold-400/[0.12] text-gold-300 ring-1 ring-gold-400/30"
                  : "bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] hover:text-gold-300"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${entry.favorite ? "fill-gold-400 text-gold-400" : ""}`}
              />
            </button>
            <button
              type="button"
              aria-label="Remove from library"
              title="Remove from library"
              onClick={() => {
                if (window.confirm(`Remove "${details.title}" from your library?`)) {
                  remove.mutate();
                }
              }}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] transition hover:bg-red-500/15 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-300/90">
          That didn't save — {error}
        </p>
      )}
    </div>
  );
}

/* ── Personal tags (main column) ────────────────────────────────── */

function TagsEditor({ entry }: { entry: LibraryEntry }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const update = useMutation({
    mutationFn: (tags: string[]) => api.updateEntry(entry.id, { tags }),
    onSuccess: () => invalidateLibraryData(qc),
  });

  const addTag = () => {
    const t = draft.trim().toLowerCase();
    if (!t) return;
    setDraft("");
    if (entry.tags.includes(t)) return;
    update.mutate([...entry.tags, t]);
  };

  return (
    <div className="max-w-[68ch]">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-mist-400">
        Your tags — teach the AI your taste vocabulary
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {entry.tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-gold-400/[0.1] py-1 pl-2.5 pr-1.5 text-2xs font-medium text-gold-300 ring-1 ring-gold-400/25"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove tag ${t}`}
              onClick={() => update.mutate(entry.tags.filter((x) => x !== t))}
              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-gold-300/70 transition hover:bg-gold-400 hover:text-ink-950"
            >
              <X className="h-2.5 w-2.5" strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          aria-label="Add a taste tag"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={entry.tags.length ? "add tag…" : "slow-burn · fast-hook · rewatchable…"}
          className="min-w-[140px] flex-1 rounded-lg bg-ink-800/60 px-2.5 py-1.5 text-2xs text-mist-200 placeholder-mist-400/60 outline-none ring-1 ring-white/[0.08] transition focus:ring-gold-400/40"
        />
      </div>
    </div>
  );
}

/* ── Notes (main column, typographic) ───────────────────────────── */

function NotesBlock({ entry }: { entry: LibraryEntry }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(entry.notes);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPersisted = useRef(entry.notes);
  const draftRef = useRef(entry.notes);

  useEffect(() => {
    setNotes(entry.notes);
    latestPersisted.current = entry.notes;
    draftRef.current = entry.notes;
  }, [entry.id]);

  // adopt external updates (e.g. the AI appended a note) when not dirty
  useEffect(() => {
    if (
      entry.notes !== latestPersisted.current &&
      draftRef.current === latestPersisted.current
    ) {
      setNotes(entry.notes);
      latestPersisted.current = entry.notes;
      draftRef.current = entry.notes;
    }
  }, [entry.notes]);

  const persist = useCallback(
    (value: string) => {
      if (value === latestPersisted.current) return;
      latestPersisted.current = value;
      api.updateEntry(entry.id, { notes: value }).then(() => {
        setSaved(true);
        invalidateLibraryData(qc);
        setTimeout(() => setSaved(false), 1500);
      });
    },
    [entry.id, qc],
  );

  const onChange = (value: string) => {
    setNotes(value);
    draftRef.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(value), 900);
  };

  // real flush on unmount — the debounce can't eat your words
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      persist(draftRef.current);
    };
  }, [persist]);

  return (
    <div className="max-w-[68ch]">
      <label
        htmlFor="lumina-notes"
        className="mb-2 flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-mist-400"
      >
        Your notes — the AI reads these
        {saved && <span className="normal-case text-gold-300">Saved ✦</span>}
      </label>
      <textarea
        id="lumina-notes"
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => persist(notes)}
        rows={3}
        placeholder="What resonated? Pacing, tone, a performance… future-you (and Lumina) will thank you."
        className="w-full resize-y rounded-xl bg-ink-800/80 px-3.5 py-2.5 text-sm leading-relaxed text-mist-200 placeholder-mist-400/60 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50"
      />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function TitleDetail() {
  const { type, tmdbId } = useParams<{ type: MediaType; tmdbId: string }>();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const id = Number(tmdbId);
  const [trailerOpen, setTrailerOpen] = useState(false);
  // Lumina's take: generated on request; expands in-flow into a band above
  // the grid (never a modal). Both flags lift here so the band and the rail
  // card stay in step.
  const [takeRequested, setTakeRequested] = useState(false);
  const [takeExpanded, setTakeExpanded] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const q = useQuery({
    queryKey: ["title", type, id],
    queryFn: () => api.title(type as MediaType, id),
    enabled: (type === "movie" || type === "tv") && Number.isFinite(id),
  });

  useEffect(() => {
    setHeroImgFailed(false);
    setLogoFailed(false);
  }, [id]);

  if (q.isLoading) {
    return (
      <div>
        <div className="skeleton mb-6 h-[400px] w-full rounded-3xl" />
        <div className="skeleton mb-8 h-[76px] w-full rounded-2xl" />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_340px]">
          <div className="skeleton h-32 rounded-xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="py-20 text-center text-mist-400">
        <p className="mb-4">{(q.error as Error)?.message ?? "Title not found."}</p>
        <button type="button" className="btn-ghost mx-auto" onClick={() => q.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const { details, library } = q.data;
  const bg = backdrop(details.backdropPath, "w1280");
  const posterSrc = poster(details.posterPath, "w500");
  const logoSrc = logo(details.logoPath);
  const showRecap =
    details.mediaType === "tv" &&
    library != null &&
    library.status === "watching" &&
    (library.watchedEpisodes ?? 0) > 0;

  return (
    <div key={`${type}-${id}`}>
      <button
        type="button"
        onClick={() =>
          window.history.length > 2 ? navigate(-1) : navigate("/library")
        }
        className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-mist-400 transition hover:text-gold-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mb-6 overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
        <div className="relative min-h-[340px]">
          {bg && !heroImgFailed ? (
            <img
              src={bg}
              alt=""
              onError={() => setHeroImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ink-700 via-ink-850 to-ink-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-6 p-6 pt-24 sm:flex-row sm:items-end sm:p-10 sm:pt-28">
            {posterSrc && (
              <motion.img
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                src={posterSrc}
                alt={details.title}
                className="hidden w-44 shrink-0 rounded-xl ring-1 ring-white/20 shadow-2xl sm:block"
              />
            )}
            <div className="min-w-0">
              {logoSrc && !logoFailed ? (
                <img
                  src={logoSrc}
                  alt={details.title}
                  onError={() => setLogoFailed(true)}
                  className="max-h-24 w-auto max-w-full object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:max-h-32 sm:max-w-[460px]"
                />
              ) : (
                <h1 className="font-display text-4xl font-semibold leading-tight text-white [text-wrap:balance] sm:text-5xl">
                  {details.title}
                </h1>
              )}
              {details.tagline && (
                <p className="mt-2 font-display italic text-mist-300">
                  {details.tagline}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-300">
                {details.year && <span>{details.year}</span>}
                <span className="uppercase tracking-wider text-mist-400">
                  {details.mediaType === "tv" ? "Series" : "Film"}
                </span>
                {details.nextEpisodeToAir?.airDate && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gold-400/[0.12] px-2.5 py-0.5 text-2xs font-semibold text-gold-300 ring-1 ring-gold-400/25">
                    <CalendarClock className="h-3 w-3" />
                    Next episode {details.nextEpisodeToAir.airDate}
                  </span>
                )}
              </div>
              {/* Critics scores strip — visible for every title, library or not */}
              {details.imdbRating != null || details.rtRating != null || details.voteAverage != null ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {library?.rating != null && (
                    <span className="flex items-center gap-1 rounded-md bg-gold-400/[0.14] px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-gold-300 ring-1 ring-gold-400/25">
                      You {library.rating}
                    </span>
                  )}
                  {details.imdbRating != null && (
                    <CriticsBadge source="imdb" score={details.imdbRating} />
                  )}
                  {details.rtRating != null && (
                    <CriticsBadge source="rt" score={details.rtRating} />
                  )}
                  {details.voteAverage != null && (
                    <CriticsBadge source="tmdb" score={details.voteAverage} />
                  )}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {details.genres.map((g) => (
                  <Chip key={g}>{g}</Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary task: full-width action bar */}
      <ActionBar
        details={details}
        entry={library}
        onPlayTrailer={details.trailerKey ? () => setTrailerOpen(true) : null}
      />

      {/* Lumina's take, expanded in-flow: a full-width band that the rest of
          the page simply makes room for (no overlay). */}
      <AnimatePresence>
        {takeExpanded && (
          <TakeBand
            details={details}
            requested={takeRequested}
            onCollapse={() => setTakeExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Editorial main column + reference rail.
          Not in library yet → single relaxed column (no void). */}
      {library ? (
        <div className="mb-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_340px]">
          <div className="min-w-0 space-y-8">
            <p className="max-w-[68ch] text-lg leading-[1.75] text-mist-200 [text-wrap:pretty]">
              {details.overview}
            </p>
            {showRecap && <RecapCard entry={library} />}
            <NotesBlock entry={library} />
            <TagsEditor entry={library} />
            {details.mediaType === "tv" && (
              <EpisodeTracker key={library.id} libraryId={library.id} />
            )}
          </div>

          <div className="space-y-5 self-start lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-1">
            <InsightCard
              details={details}
              requested={takeRequested}
              expanded={takeExpanded}
              onActivate={() => {
                setTakeRequested(true);
                setTakeExpanded(true);
              }}
              onExpand={() => setTakeExpanded(true)}
            />
            <WhereToWatch details={details} />
            <FactsCard details={details} entry={library} />
          </div>
        </div>
      ) : (
        <div className="mb-12 space-y-8">
          <p className="max-w-[68ch] text-lg leading-[1.75] text-mist-200 [text-wrap:pretty]">
            {details.overview}
          </p>
          <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            <InsightCard
              details={details}
              requested={takeRequested}
              expanded={takeExpanded}
              onActivate={() => {
                setTakeRequested(true);
                setTakeExpanded(true);
              }}
              onExpand={() => setTakeExpanded(true)}
            />
            <WhereToWatch details={details} />
            <FactsCard details={details} entry={null} />
          </div>
        </div>
      )}

      <CastRow details={details} />

      {details.similar.length > 0 && (
        <Carousel title="In the same orbit" eyebrow="If this resonates">
          {details.similar.map((s) => (
            <PosterCard key={`${s.mediaType}${s.tmdbId}`} item={s} />
          ))}
        </Carousel>
      )}

      <AnimatePresence>
        {trailerOpen && details.trailerKey && (
          <TrailerLightbox
            trailerKey={details.trailerKey}
            title={details.title}
            onClose={() => setTrailerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

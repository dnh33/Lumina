import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { backdrop, poster, profile } from "../lib/img";
import { Carousel } from "../components/Carousel";
import { PosterCard } from "../components/PosterCard";
import { Chip, RatingDial } from "../components/Bits";
import { EpisodeTracker } from "../components/EpisodeTracker";
import type {
  LibraryEntry,
  LibraryStatus,
  MediaType,
  TitleDetails,
} from "../lib/types";

/* ── AI insight (side rail) ─────────────────────────────────────── */

function InsightCard({ details }: { details: TitleDetails }) {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const [requested, setRequested] = useState(false);
  const insight = useQuery({
    queryKey: ["insight", details.mediaType, details.tmdbId],
    queryFn: () => api.insight(details.mediaType, details.tmdbId),
    enabled: requested,
    staleTime: Infinity,
  });
  const refresh = useMutation({
    mutationFn: () => api.insight(details.mediaType, details.tmdbId, true),
    onSuccess: () => insight.refetch(),
  });

  if (health.data && !health.data.aiConfigured) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="panel p-5 ring-gold-400/15"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-gold-300">
          <Sparkles className="h-[18px] w-[18px]" /> Lumina's take
        </h3>
        {insight.data && (
          <button
            type="button"
            aria-label="Regenerate insight"
            title="Regenerate"
            onClick={() => refresh.mutate()}
            className="icon-btn"
          >
            <RefreshCw
              className={`h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {!requested ? (
        <div>
          <p className="mb-4 text-sm leading-relaxed text-mist-400">
            A personal, spoiler-free reflection on whether this fits your
            taste — grounded in your ratings and notes.
          </p>
          <button
            type="button"
            onClick={() => setRequested(true)}
            className="btn-primary"
          >
            Why would I love this?
          </button>
        </div>
      ) : insight.isLoading || refresh.isPending ? (
        <div className="flex items-center gap-3 py-3 text-sm text-mist-400">
          <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
          Reading your taste profile…
        </div>
      ) : insight.isError ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-300/90">
            {(insight.error as Error).message}
          </p>
          <button type="button" className="btn-ghost" onClick={() => insight.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <p className="font-display text-[1.02rem] leading-relaxed text-mist-200">
          {insight.data?.text}
        </p>
      )}
    </motion.section>
  );
}

/* ── Facts (side rail) ──────────────────────────────────────────── */

function FactsCard({ details }: { details: TitleDetails }) {
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
  if (details.voteAverage != null) {
    rows.push({
      label: "TMDB score",
      value: (
        <span className="flex items-center gap-1 tabular-nums">
          <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
          {details.voteAverage.toFixed(1)}
        </span>
      ),
    });
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
}: {
  details: TitleDetails;
  entry: LibraryEntry | null;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["title", details.mediaType, details.tmdbId] });
    qc.invalidateQueries({ queryKey: ["library"] });
    qc.invalidateQueries({ queryKey: ["library-stats"] });
    qc.invalidateQueries({ queryKey: ["library-genres"] });
    qc.invalidateQueries({ queryKey: ["for-you"] });
    qc.invalidateQueries({ queryKey: ["up-next"] });
  };

  const add = useMutation({
    mutationFn: (status: LibraryStatus) =>
      api.addToLibrary({
        tmdbId: details.tmdbId,
        mediaType: details.mediaType,
        status,
      }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: (patch: Parameters<typeof api.updateEntry>[1]) =>
      api.updateEntry(entry!.id, patch),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => api.removeEntry(entry!.id),
    onSuccess: () => {
      invalidate();
      navigate("/library");
    },
  });

  if (!entry) {
    return (
      <div className="panel mb-8 flex flex-wrap items-center gap-3 p-4 sm:px-5">
        <p className="mr-2 text-sm font-medium text-mist-400">
          Not in your archive yet
        </p>
        <button
          type="button"
          disabled={add.isPending}
          onClick={() => add.mutate("watched")}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> I've watched this
        </button>
        <button
          type="button"
          disabled={add.isPending}
          onClick={() => add.mutate("watchlist")}
          className="btn-ghost"
        >
          Save to watchlist
        </button>
        {details.mediaType === "tv" && (
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate("watching")}
            className="btn-ghost"
          >
            Currently watching
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="panel mb-8 flex flex-wrap items-center gap-x-5 gap-y-4 p-4 sm:px-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
        {(["watched", "watching", "watchlist", "abandoned"] as const).map((s) => (
          <button
            key={s}
            type="button"
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
        <button
          type="button"
          aria-label={entry.favorite ? "Remove favorite" : "Mark favorite"}
          title={entry.favorite ? "Remove favorite" : "Mark favorite"}
          onClick={() => update.mutate({ favorite: !entry.favorite })}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition ${
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
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] transition hover:bg-red-500/15 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Personal tags (main column) ────────────────────────────────── */

function TagsEditor({ entry }: { entry: LibraryEntry }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const update = useMutation({
    mutationFn: (tags: string[]) => api.updateEntry(entry.id, { tags }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["title", entry.mediaType, entry.tmdbId] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["taste-profile"] });
    },
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
            className="group/tag flex items-center gap-1 rounded-full bg-gold-400/[0.1] py-1 pl-2.5 pr-1.5 text-2xs font-medium text-gold-300 ring-1 ring-gold-400/25"
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
  const latest = useRef(entry.notes);

  useEffect(() => {
    setNotes(entry.notes);
    latest.current = entry.notes;
  }, [entry.id]);

  const persist = useCallback(
    (value: string) => {
      if (value === latest.current) return;
      latest.current = value;
      api.updateEntry(entry.id, { notes: value }).then(() => {
        setSaved(true);
        qc.invalidateQueries({ queryKey: ["library"] });
        setTimeout(() => setSaved(false), 1500);
      });
    },
    [entry.id, qc],
  );

  const onChange = (value: string) => {
    setNotes(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(value), 900);
  };

  // flush pending notes on unmount — no lost words
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

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
  const id = Number(tmdbId);

  const q = useQuery({
    queryKey: ["title", type, id],
    queryFn: () => api.title(type as MediaType, id),
    enabled: (type === "movie" || type === "tv") && Number.isFinite(id),
  });

  if (q.isLoading) {
    return (
      <div>
        <div className="skeleton mb-8 h-[400px] w-full rounded-3xl" />
        <div className="skeleton mb-8 h-16 w-full rounded-2xl" />
        <div className="skeleton h-24 w-2/3 rounded-xl" />
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

  return (
    <div>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mb-6 overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
        <div className="relative min-h-[340px]">
          {bg && (
            <img
              src={bg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-6 p-6 pt-24 sm:flex-row sm:items-end sm:p-10 sm:pt-28">
            {posterSrc && (
              <motion.img
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                src={posterSrc}
                alt={details.title}
                className="hidden w-44 shrink-0 rounded-xl ring-1 ring-white/20 shadow-2xl sm:block"
              />
            )}
            <div className="min-w-0">
              <h1 className="font-display text-4xl font-semibold leading-tight text-white [text-wrap:balance] sm:text-5xl">
                {details.title}
              </h1>
              {details.tagline && (
                <p className="mt-1.5 font-display italic text-mist-300">
                  {details.tagline}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-300">
                {details.year && <span>{details.year}</span>}
                <span className="uppercase tracking-wider text-mist-400">
                  {details.mediaType === "tv" ? "Series" : "Film"}
                </span>
              </div>
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
      <ActionBar details={details} entry={library} />

      {/* Editorial main column + sticky reference rail */}
      <div className="mb-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="min-w-0 space-y-8">
          <p className="max-w-[68ch] text-[1.02rem] leading-[1.75] text-mist-200 [text-wrap:pretty]">
            {details.overview}
          </p>
          {library && <NotesBlock entry={library} />}
          {library && <TagsEditor entry={library} />}
          {details.mediaType === "tv" && library && (
            <EpisodeTracker libraryId={library.id} />
          )}
        </div>

        <div className="space-y-5 self-start lg:sticky lg:top-6">
          <InsightCard details={details} />
          <FactsCard details={details} />
        </div>
      </div>

      <CastRow details={details} />

      {details.similar.length > 0 && (
        <Carousel title="In the same orbit" eyebrow="If this resonates">
          {details.similar.map((s) => (
            <PosterCard key={`${s.mediaType}${s.tmdbId}`} item={s} />
          ))}
        </Carousel>
      )}
    </div>
  );
}

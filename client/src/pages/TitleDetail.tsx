import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { api } from "../lib/api";
import { backdrop, poster, profile } from "../lib/img";
import { Carousel } from "../components/Carousel";
import { PosterCard } from "../components/PosterCard";
import { Chip, RatingDial } from "../components/Bits";
import { EpisodeTracker } from "../components/EpisodeTracker";
import type { LibraryEntry, LibraryStatus, MediaType, TitleDetails } from "../lib/types";

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
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-400/[0.09] to-transparent p-[1px]"
    >
      <div className="rounded-2xl bg-ink-850/90 p-6 ring-1 ring-gold-400/20">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-gold-300">
            <Sparkles className="h-[18px] w-[18px]" /> Lumina's take, for you
          </h3>
          {insight.data && (
            <button
              type="button"
              title="Regenerate"
              onClick={() => refresh.mutate()}
              className="rounded-lg p-1.5 text-mist-400 transition hover:bg-white/[0.06] hover:text-gold-300"
            >
              <RefreshCw
                className={`h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>

        {!requested ? (
          <div>
            <p className="mb-4 text-sm text-mist-400">
              A personal reflection on whether this fits your taste — grounded
              in your ratings, notes and history. Spoiler-free, always.
            </p>
            <button
              type="button"
              onClick={() => setRequested(true)}
              className="rounded-xl bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
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
          <p className="text-sm text-red-300/80">
            {(insight.error as Error).message}
          </p>
        ) : (
          <p className="font-display text-[1.02rem] leading-relaxed text-mist-200">
            {insight.data?.text}
          </p>
        )}
      </div>
    </motion.section>
  );
}

function LibraryPanel({
  details,
  entry,
}: {
  details: TitleDetails;
  entry: LibraryEntry | null;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => setNotes(entry?.notes ?? ""), [entry?.id, entry?.notes]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["title", details.mediaType, details.tmdbId] });
    qc.invalidateQueries({ queryKey: ["library"] });
    qc.invalidateQueries({ queryKey: ["library-stats"] });
    qc.invalidateQueries({ queryKey: ["library-genres"] });
    qc.invalidateQueries({ queryKey: ["for-you"] });
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
      <div className="panel p-5">
        <p className="mb-3 text-sm font-medium text-mist-300">
          Not in your archive yet
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate("watched")}
            className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> I've watched this
          </button>
          <button
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate("watchlist")}
            className="rounded-xl bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-mist-200 ring-1 ring-white/12 transition hover:bg-white/[0.12] disabled:opacity-60"
          >
            Save to watchlist
          </button>
          {details.mediaType === "tv" && (
            <button
              type="button"
              disabled={add.isPending}
              onClick={() => add.mutate("watching")}
              className="rounded-xl bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-mist-200 ring-1 ring-white/12 transition hover:bg-white/[0.12] disabled:opacity-60"
            >
              Currently watching
            </button>
          )}
        </div>
      </div>
    );
  }

  const saveNotes = () => {
    if (notes === entry.notes) return;
    update.mutate({ notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1600);
  };

  return (
    <div className="panel space-y-5 p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        {(["watched", "watching", "watchlist", "abandoned"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update.mutate({ status: s })}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium capitalize transition ${
              entry.status === s
                ? "bg-gold-400/[0.15] text-gold-300 ring-1 ring-gold-400/35"
                : "bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] hover:text-mist-200"
            }`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          title={entry.favorite ? "Remove favorite" : "Mark favorite"}
          onClick={() => update.mutate({ favorite: !entry.favorite })}
          className={`ml-auto flex h-9 w-9 items-center justify-center rounded-xl transition ${
            entry.favorite
              ? "bg-gold-400/[0.15] text-gold-300 ring-1 ring-gold-400/35"
              : "bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] hover:text-gold-300"
          }`}
        >
          <Heart className={`h-4 w-4 ${entry.favorite ? "fill-gold-400 text-gold-400" : ""}`} />
        </button>
        <button
          type="button"
          title="Remove from library"
          onClick={() => remove.mutate()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] transition hover:bg-red-500/15 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-wider text-mist-400">
          Your rating
        </p>
        <RatingDial
          value={entry.rating}
          onChange={(v) => update.mutate({ rating: v })}
        />
      </div>

      <div>
        <p className="mb-2 flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-wider text-mist-400">
          Your notes — the AI reads these
          {notesSaved && <span className="text-gold-300 normal-case">Saved ✦</span>}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          placeholder="What resonated? Pacing, tone, a performance… future-you (and Lumina) will thank you."
          className="w-full resize-y rounded-xl bg-ink-800/80 px-3.5 py-2.5 text-sm leading-relaxed text-mist-200 placeholder-mist-400/40 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50"
        />
      </div>
    </div>
  );
}

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
        <div className="skeleton mb-8 h-[380px] w-full rounded-3xl" />
        <div className="skeleton mb-3 h-6 w-1/3 rounded-md" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="py-20 text-center text-mist-400">
        <p>{(q.error as Error)?.message ?? "Title not found."}</p>
      </div>
    );
  }

  const { details, library } = q.data;
  const bg = backdrop(details.backdropPath, "w1280");
  const posterSrc = poster(details.posterPath, "w500");
  const meta = [
    details.year,
    details.mediaType === "tv"
      ? `${details.seasonsCount ?? "?"} season${(details.seasonsCount ?? 0) === 1 ? "" : "s"}`
      : details.runtime
        ? `${details.runtime} min`
        : null,
    details.director ? `by ${details.director}` : null,
  ].filter(Boolean);

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm text-mist-400 transition hover:text-gold-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mb-8 overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
        <div className="relative min-h-[340px]">
          {bg && (
            <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
              <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {details.title}
              </h1>
              {details.tagline && (
                <p className="mt-1.5 font-display italic text-mist-300">
                  {details.tagline}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-mist-300">
                {details.voteAverage != null && (
                  <span className="flex items-center gap-1 font-semibold text-gold-300">
                    <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
                    {details.voteAverage.toFixed(1)}
                  </span>
                )}
                <span>{meta.join("  ·  ")}</span>
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

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <p className="max-w-3xl text-[0.95rem] leading-[1.75] text-mist-300">
            {details.overview}
          </p>
          <LibraryPanel details={details} entry={library} />
          {details.mediaType === "tv" && library && (
            <EpisodeTracker libraryId={library.id} />
          )}
        </div>
        <div className="space-y-6">
          <InsightCard details={details} />
          {details.cast.length > 0 && (
            <div className="panel p-5">
              <h3 className="mb-3 font-display text-lg font-semibold text-mist-200">
                Cast
              </h3>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {details.cast.map((c) => {
                  const img = profile(c.profilePath);
                  return (
                    <div key={c.name} className="w-[74px] shrink-0 text-center">
                      <div className="mx-auto mb-1.5 h-[74px] w-[74px] overflow-hidden rounded-full bg-ink-700 ring-1 ring-white/10">
                        {img ? (
                          <img src={img} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center font-display text-lg text-mist-400">
                            {c.name[0]}
                          </div>
                        )}
                      </div>
                      <p className="truncate text-[0.7rem] font-medium text-mist-300">
                        {c.name}
                      </p>
                      {c.character && (
                        <p className="truncate text-[0.64rem] text-mist-400">
                          {c.character}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Plus, Search, Tag } from "lucide-react";
import { api } from "../lib/api";
import { PosterCard } from "../components/PosterCard";
import { AddModal } from "../components/AddModal";
import { EmptyState, PosterSkeletonGrid } from "../components/Bits";
import type { LibraryEntry } from "../lib/types";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "watched", label: "Watched" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
  { key: "favorites", label: "Favorites" },
  { key: "abandoned", label: "Abandoned" },
] as const;

type StatusKey = (typeof STATUS_TABS)[number]["key"];

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <p className="font-display text-xl font-semibold tabular-nums text-gold-300">
        {value}
      </p>
      <p className="text-2xs font-medium uppercase tracking-wider text-mist-400">
        {label}
      </p>
    </>
  );
  if (!onClick) return <div className="panel px-4 py-3">{inner}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="panel cursor-pointer px-4 py-3 text-left transition hover:ring-gold-400/30"
    >
      {inner}
    </button>
  );
}

function statusRibbon(e: LibraryEntry): string | undefined {
  if (e.status === "watching") {
    if (e.mediaType === "tv" && e.episodesCount) {
      return `Watching · ${e.watchedEpisodes ?? 0}/${e.episodesCount} eps`;
    }
    return "Watching";
  }
  if (e.status === "watchlist") return "Watchlist";
  if (e.status === "abandoned") return "Abandoned";
  return undefined;
}

const EMPTY_COPY: Record<StatusKey, string> = {
  all: "",
  watched: "Nothing marked watched yet — log what you've seen and the AI sharpens fast.",
  watching: "You're not mid-series on anything. Start a show and track it episode by episode.",
  watchlist: "Your watchlist is empty. Save anything that catches your eye — one tap on any poster.",
  favorites: "No favorites yet — tap the heart on titles that define your taste.",
  abandoned: "Nothing abandoned. When a show loses you, marking it teaches the AI what doesn't work.",
};

export default function Library() {
  const [status, setStatus] = useState<StatusKey>("all");
  const [type, setType] = useState("");
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("added");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 250);
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = { status, sort };
    if (type) p.type = type;
    if (genre) p.genre = genre;
    if (tag) p.tag = tag;
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    return p;
  }, [status, type, genre, tag, sort, debouncedSearch]);

  const entries = useQuery({
    queryKey: ["library", params],
    queryFn: () => api.library(params),
  });
  const stats = useQuery({ queryKey: ["library-stats"], queryFn: api.libraryStats });
  const genres = useQuery({ queryKey: ["library-genres"], queryFn: api.libraryGenres });
  const tags = useQuery({ queryKey: ["library-tags"], queryFn: api.libraryTags });

  const hasActiveFilters =
    status !== "all" || !!type || !!genre || !!tag || !!debouncedSearch.trim();

  const clearFilters = () => {
    setStatus("all");
    setType("");
    setGenre("");
    setTag("");
    setSearch("");
  };

  const selectCls =
    "rounded-xl bg-ink-800/80 px-3 py-2.5 text-sm text-mist-300 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-mist-200">
            Your archive
          </h1>
          <p className="mt-1 text-sm text-mist-400">
            Everything you've watched, loved, and queued — remembered forever.
          </p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add title
        </button>
      </div>

      {stats.data && stats.data.total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatCard
            label="Titles"
            value={stats.data.total}
            active={!hasActiveFilters}
            onClick={clearFilters}
          />
          <StatCard
            label="Films"
            value={stats.data.movies}
            active={type === "movie"}
            onClick={() => setType(type === "movie" ? "" : "movie")}
          />
          <StatCard
            label="Series"
            value={stats.data.shows}
            active={type === "tv"}
            onClick={() => setType(type === "tv" ? "" : "tv")}
          />
          <StatCard
            label="Favorites"
            value={stats.data.favorites}
            active={status === "favorites"}
            onClick={() => setStatus(status === "favorites" ? "all" : "favorites")}
          />
          <StatCard label="Avg rating" value={stats.data.avgRating ?? "—"} />
          <StatCard label="Hours" value={`≈${stats.data.estimatedHours}`} />
        </div>
      )}

      <div className="mb-7 flex flex-wrap items-center gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              aria-pressed={status === t.key}
              className={`pill flex items-center gap-1.5 ${status === t.key ? "pill-active" : ""}`}
            >
              {t.key === "favorites" && <Heart className="h-3.5 w-3.5" />}
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter…"
              className="w-36 rounded-xl bg-ink-800/80 py-2.5 pl-9 pr-3 text-sm text-mist-200 placeholder-mist-400/80 outline-none ring-1 ring-white/10 transition focus:w-48 focus:ring-gold-400/50"
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls} aria-label="Type filter">
            <option value="">All types</option>
            <option value="movie">Films</option>
            <option value="tv">Series</option>
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className={selectCls} aria-label="Genre filter">
            <option value="">All genres</option>
            {genres.data?.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {(tags.data?.length ?? 0) > 0 && (
            <select value={tag} onChange={(e) => setTag(e.target.value)} className={selectCls} aria-label="Tag filter">
              <option value="">All tags</option>
              {tags.data?.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
          )}
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls} aria-label="Sort order">
            <option value="added">Recently added</option>
            <option value="updated">Recently updated</option>
            <option value="rating">Highest rated</option>
            <option value="title">A–Z</option>
            <option value="year">Newest</option>
          </select>
        </div>
      </div>

      {entries.isLoading ? (
        <PosterSkeletonGrid />
      ) : entries.isError ? (
        <div className="panel mx-auto my-14 flex max-w-lg items-center justify-between gap-4 p-6">
          <p className="text-sm text-mist-300">
            Couldn't load your library — {(entries.error as Error).message}
          </p>
          <button type="button" className="btn-ghost" onClick={() => entries.refetch()}>
            Retry
          </button>
        </div>
      ) : entries.data && entries.data.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(138px,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {entries.data.map((e) => (
            <PosterCard
              key={e.id}
              width="w-full"
              item={{
                tmdbId: e.tmdbId,
                mediaType: e.mediaType,
                title: e.title,
                year: e.year,
                overview: e.overview,
                posterPath: e.posterPath,
                backdropPath: e.backdropPath,
                voteAverage: e.voteAverage,
                genreIds: [],
                popularity: null,
                inLibrary: true,
              }}
              myRating={e.rating}
              subtitle={statusRibbon(e) ?? [e.year, e.mediaType === "tv" ? "Series" : "Film"].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
      ) : !stats.isSuccess || stats.data.total > 0 ? (
        /* library has titles — this particular view is empty */
        <div className="panel mx-auto my-14 max-w-lg px-8 py-10 text-center">
          <Tag className="mx-auto mb-3 h-6 w-6 text-gold-400" />
          <p className="text-sm leading-relaxed text-mist-300">
            {debouncedSearch.trim() || genre || tag || type
              ? "No titles match these filters."
              : EMPTY_COPY[status] || "Nothing here yet."}
          </p>
          {hasActiveFilters && (
            <button type="button" className="btn-ghost mx-auto mt-5" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <EmptyState
          title="Begin your archive"
          action={
            <button type="button" onClick={() => setAddOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add your first title
            </button>
          }
        >
          Log a handful of films and series you love (with ratings) and
          Lumina's recommendations sharpen dramatically. Your history is the
          foundation for everything.
        </EmptyState>
      )}

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
    );
}

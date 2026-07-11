import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Plus, Search } from "lucide-react";
import { api } from "../lib/api";
import { PosterCard } from "../components/PosterCard";
import { AddModal } from "../components/AddModal";
import { EmptyState, PosterSkeletonRow } from "../components/Bits";
import type { LibraryEntry } from "../lib/types";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "watched", label: "Watched" },
  { key: "watching", label: "Watching" },
  { key: "watchlist", label: "Watchlist" },
  { key: "favorites", label: "Favorites" },
] as const;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel px-4 py-3">
      <p className="font-display text-xl font-semibold text-gold-300">{value}</p>
      <p className="text-[0.7rem] font-medium uppercase tracking-wider text-mist-400">
        {label}
      </p>
    </div>
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

export default function Library() {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]["key"]>("all");
  const [type, setType] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("added");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = { status, sort };
    if (type) p.type = type;
    if (genre) p.genre = genre;
    if (search.trim()) p.search = search.trim();
    return p;
  }, [status, type, genre, sort, search]);

  const entries = useQuery({
    queryKey: ["library", params],
    queryFn: () => api.library(params),
  });
  const stats = useQuery({ queryKey: ["library-stats"], queryFn: api.libraryStats });
  const genres = useQuery({ queryKey: ["library-genres"], queryFn: api.libraryGenres });

  const selectCls =
    "rounded-xl bg-ink-800/80 px-3 py-2 text-sm text-mist-300 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50";

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
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
        >
          <Plus className="h-4 w-4" /> Add title
        </button>
      </div>

      {stats.data && stats.data.total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatCard label="Titles" value={stats.data.total} />
          <StatCard label="Films" value={stats.data.movies} />
          <StatCard label="Series" value={stats.data.shows} />
          <StatCard label="Favorites" value={stats.data.favorites} />
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
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                status === t.key
                  ? "bg-gold-400/[0.14] text-gold-300 ring-1 ring-gold-400/30"
                  : "bg-white/[0.04] text-mist-400 ring-1 ring-white/[0.08] hover:text-mist-200"
              }`}
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
              className="w-36 rounded-xl bg-ink-800/80 py-2 pl-9 pr-3 text-sm text-mist-200 placeholder-mist-400/50 outline-none ring-1 ring-white/10 transition focus:w-48 focus:ring-gold-400/50"
            />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
            <option value="">All types</option>
            <option value="movie">Films</option>
            <option value="tv">Series</option>
          </select>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className={selectCls}>
            <option value="">All genres</option>
            {genres.data?.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            <option value="added">Recently added</option>
            <option value="updated">Recently updated</option>
            <option value="rating">Highest rated</option>
            <option value="title">A–Z</option>
            <option value="year">Newest</option>
          </select>
        </div>
      </div>

      {entries.isLoading ? (
        <PosterSkeletonRow count={8} />
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
      ) : (
        <EmptyState
          title="Begin your archive"
          action={
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
            >
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

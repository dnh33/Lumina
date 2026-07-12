import type { DB } from "../db/connection.js";

/**
 * RAG · Layer 1 — Taste profile.
 * Aggregates the entire library into a compact, always-available portrait
 * of the user's taste: what they love, what they avoid, how they rate,
 * and what they've been watching lately.
 */

export interface GenreAffinity {
  name: string;
  count: number;
  avgRating: number | null;
}

export interface PersonAffinity {
  name: string;
  count: number;
  avgRating: number;
}

export interface TasteProfile {
  librarySize: number;
  movies: number;
  shows: number;
  ratedCount: number;
  avgRating: number | null;
  topTags: { name: string; count: number }[];
  topGenres: GenreAffinity[];
  avoidedGenres: GenreAffinity[];
  lovedTitles: { title: string; year: number | null; rating: number | null; mediaType: string; notes: string }[];
  dislikedTitles: { title: string; year: number | null; rating: number | null }[];
  favoriteDirectors: PersonAffinity[];
  recentWatches: { title: string; rating: number | null; when: string | null }[];
  watchlistSample: { title: string; year: number | null }[];
  currentlyWatching: { title: string; progress: string }[];
}

interface EntryRow {
  title: string;
  year: number | null;
  media_type: string;
  genres: string;
  director: string | null;
  status: string;
  rating: number | null;
  notes: string;
  tags: string;
  favorite: number;
  watched_at: string | null;
  updated_at: string;
  title_id: number;
  episodes_count: number | null;
}

export function computeTasteProfile(db: DB): TasteProfile {
  const rows = db
    .prepare(
      `SELECT t.title, t.year, t.media_type, t.genres, t.director, t.episodes_count,
              l.status, l.rating, l.notes, l.tags, l.favorite, l.watched_at, l.updated_at, l.title_id
       FROM library l JOIN titles t ON t.id = l.title_id`,
    )
    .all() as EntryRow[];

  // Personal tags — the user's own vocabulary for their taste
  const tagAgg = new Map<string, number>();
  for (const r of rows) {
    for (const tag of JSON.parse(r.tags || "[]") as string[]) {
      tagAgg.set(tag, (tagAgg.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagAgg.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Genre affinities (weighted by presence + rating)
  const genreAgg = new Map<string, { count: number; sum: number; rated: number }>();
  const directorAgg = new Map<string, { count: number; sum: number; rated: number }>();

  for (const r of rows) {
    if (r.status === "watchlist") continue;
    for (const g of JSON.parse(r.genres) as string[]) {
      const a = genreAgg.get(g) ?? { count: 0, sum: 0, rated: 0 };
      a.count++;
      if (r.rating != null) {
        a.sum += r.rating;
        a.rated++;
      }
      genreAgg.set(g, a);
    }
    if (r.director && r.rating != null) {
      const d = directorAgg.get(r.director) ?? { count: 0, sum: 0, rated: 0 };
      d.count++;
      d.sum += r.rating;
      d.rated++;
      directorAgg.set(r.director, d);
    }
  }

  const genreList: GenreAffinity[] = [...genreAgg.entries()].map(([name, a]) => ({
    name,
    count: a.count,
    avgRating: a.rated ? Math.round((a.sum / a.rated) * 10) / 10 : null,
  }));

  const topGenres = genreList
    .filter((g) => g.count >= 2)
    .sort(
      (a, b) =>
        (b.avgRating ?? 5) * Math.log2(b.count + 1) -
        (a.avgRating ?? 5) * Math.log2(a.count + 1),
    )
    .slice(0, 6);

  const avoidedGenres = genreList
    .filter((g) => g.avgRating != null && g.avgRating <= 4.5 && g.count >= 2)
    .sort((a, b) => (a.avgRating ?? 0) - (b.avgRating ?? 0))
    .slice(0, 3);

  const favoriteDirectors: PersonAffinity[] = [...directorAgg.entries()]
    .filter(([, d]) => d.rated >= 2 && d.sum / d.rated >= 7.5)
    .map(([name, d]) => ({
      name,
      count: d.count,
      avgRating: Math.round((d.sum / d.rated) * 10) / 10,
    }))
    .sort((a, b) => b.avgRating * b.count - a.avgRating * a.count)
    .slice(0, 5);

  const watched = rows.filter((r) => r.status !== "watchlist");

  const lovedTitles = watched
    .filter((r) => r.favorite || (r.rating != null && r.rating >= 9))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 15)
    .map((r) => ({
      title: r.title,
      year: r.year,
      rating: r.rating,
      mediaType: r.media_type,
      notes: r.notes.slice(0, 140),
    }));

  const dislikedTitles = watched
    .filter((r) => r.rating != null && r.rating <= 4)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
    .slice(0, 8)
    .map((r) => ({ title: r.title, year: r.year, rating: r.rating }));

  const recentWatches = watched
    .filter((r) => r.status === "watched")
    .sort((a, b) => (b.watched_at ?? b.updated_at).localeCompare(a.watched_at ?? a.updated_at))
    .slice(0, 10)
    .map((r) => ({ title: r.title, rating: r.rating, when: r.watched_at }));

  const watchlistSample = rows
    .filter((r) => r.status === "watchlist")
    .slice(0, 10)
    .map((r) => ({ title: r.title, year: r.year }));

  const epCounts = db
    .prepare(
      `SELECT title_id, SUM(watched) w, COUNT(*) n FROM episodes GROUP BY title_id`,
    )
    .all() as { title_id: number; w: number; n: number }[];
  const epMap = new Map(epCounts.map((e) => [e.title_id, e]));

  const currentlyWatching = rows
    .filter((r) => r.status === "watching")
    .slice(0, 6)
    .map((r) => {
      const ep = epMap.get(r.title_id);
      const progress =
        r.media_type === "tv" && ep
          ? `${ep.w}/${r.episodes_count ?? ep.n} episodes`
          : "in progress";
      return { title: r.title, progress };
    });

  const rated = watched.filter((r) => r.rating != null);
  return {
    librarySize: rows.length,
    movies: rows.filter((r) => r.media_type === "movie").length,
    shows: rows.filter((r) => r.media_type === "tv").length,
    ratedCount: rated.length,
    avgRating: rated.length
      ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 10) / 10
      : null,
    topTags,
    topGenres,
    avoidedGenres,
    lovedTitles,
    dislikedTitles,
    favoriteDirectors,
    recentWatches,
    watchlistSample,
    currentlyWatching,
  };
}

/** Render the profile as a compact text block for the system prompt. */
export function renderTasteProfile(p: TasteProfile): string {
  if (p.librarySize === 0) {
    return "The library is empty — the user hasn't logged anything yet. Encourage them to add a few favorites so recommendations can be personal.";
  }
  const lines: string[] = [];
  lines.push(
    `Library: ${p.librarySize} titles (${p.movies} films, ${p.shows} series). ` +
      `${p.ratedCount} rated, average ${p.avgRating ?? "—"}/10.`,
  );
  if (p.topGenres.length) {
    lines.push(
      "Strongest genres: " +
        p.topGenres
          .map((g) => `${g.name} (${g.count}× logged${g.avgRating ? `, avg ${g.avgRating}` : ""})`)
          .join(", ") + ".",
    );
  }
  if (p.avoidedGenres.length) {
    lines.push(
      "Rates poorly: " +
        p.avoidedGenres.map((g) => `${g.name} (avg ${g.avgRating})`).join(", ") + ".",
    );
  }
  if (p.topTags.length) {
    lines.push(
      "Their own tags (their taste vocabulary — weight these heavily): " +
        p.topTags.map((t) => `${t.name} (${t.count}×)`).join(", ") + ".",
    );
  }
  if (p.lovedTitles.length) {
    lines.push(
      "Loved (9–10 or favorites): " +
        p.lovedTitles
          .map((t) => `${t.title}${t.year ? ` (${t.year})` : ""}${t.rating ? ` ${t.rating}/10` : ""}${t.notes ? ` — "${t.notes}"` : ""}`)
          .join("; ") + ".",
    );
  }
  if (p.dislikedTitles.length) {
    lines.push(
      "Disliked: " +
        p.dislikedTitles
          .map((t) => `${t.title}${t.rating ? ` ${t.rating}/10` : ""}`)
          .join("; ") + ".",
    );
  }
  if (p.favoriteDirectors.length) {
    lines.push(
      "Favorite directors/creators: " +
        p.favoriteDirectors.map((d) => `${d.name} (avg ${d.avgRating} across ${d.count})`).join(", ") + ".",
    );
  }
  if (p.currentlyWatching.length) {
    lines.push(
      "Currently watching: " +
        p.currentlyWatching.map((c) => `${c.title} (${c.progress})`).join(", ") + ".",
    );
  }
  if (p.recentWatches.length) {
    lines.push(
      "Most recent watches: " +
        p.recentWatches
          .map((r) => `${r.title}${r.rating ? ` (${r.rating}/10)` : ""}`)
          .join(", ") + ".",
    );
  }
  if (p.watchlistSample.length) {
    lines.push(
      "On the watchlist: " +
        p.watchlistSample.map((w) => `${w.title}${w.year ? ` (${w.year})` : ""}`).join(", ") + ".",
    );
  }
  return lines.join("\n");
}

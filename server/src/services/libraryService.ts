import type { DB } from "../db/connection.js";
import { tmdbGet } from "../tmdb/client.js";
import {
  normalizeDetails,
  normalizeSeason,
} from "../tmdb/normalize.js";
import type {
  MediaType,
  RawSeason,
  RawTmdbDetails,
  TitleDetails,
} from "../tmdb/types.js";

export type LibraryStatus = "watched" | "watching" | "watchlist" | "abandoned";

export interface LibraryEntry {
  id: number;
  titleId: number;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  genres: string[];
  runtime: number | null;
  seasonsCount: number | null;
  episodesCount: number | null;
  director: string | null;
  voteAverage: number | null;
  status: LibraryStatus;
  rating: number | null;
  notes: string;
  favorite: boolean;
  watchedAt: string | null;
  addedAt: string;
  updatedAt: string;
  /** for tv: watched episode count (filled by listLibrary) */
  watchedEpisodes?: number;
}

interface TitleRow {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  year: number | null;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string;
  runtime: number | null;
  seasons_count: number | null;
  episodes_count: number | null;
  director: string | null;
  top_cast: string;
  vote_average: number | null;
}

interface LibraryRow {
  id: number;
  title_id: number;
  status: LibraryStatus;
  rating: number | null;
  notes: string;
  favorite: number;
  watched_at: string | null;
  added_at: string;
  updated_at: string;
}

function rowToEntry(t: TitleRow, l: LibraryRow): LibraryEntry {
  return {
    id: l.id,
    titleId: t.id,
    tmdbId: t.tmdb_id,
    mediaType: t.media_type,
    title: t.title,
    year: t.year,
    posterPath: t.poster_path,
    backdropPath: t.backdrop_path,
    overview: t.overview,
    genres: JSON.parse(t.genres),
    runtime: t.runtime,
    seasonsCount: t.seasons_count,
    episodesCount: t.episodes_count,
    director: t.director,
    voteAverage: t.vote_average,
    status: l.status,
    rating: l.rating,
    notes: l.notes,
    favorite: !!l.favorite,
    watchedAt: l.watched_at,
    addedAt: l.added_at,
    updatedAt: l.updated_at,
  };
}

/** Store or refresh the local snapshot of a TMDB title. Returns titles.id. */
export function upsertTitle(db: DB, d: TitleDetails): number {
  const existing = db
    .prepare("SELECT id FROM titles WHERE tmdb_id = ? AND media_type = ?")
    .get(d.tmdbId, d.mediaType) as { id: number } | undefined;

  const params = {
    tmdb_id: d.tmdbId,
    media_type: d.mediaType,
    title: d.title,
    year: d.year,
    overview: d.overview,
    tagline: d.tagline,
    poster_path: d.posterPath,
    backdrop_path: d.backdropPath,
    genres: JSON.stringify(d.genres),
    runtime: d.runtime,
    seasons_count: d.seasonsCount,
    episodes_count: d.episodesCount,
    director: d.director,
    top_cast: JSON.stringify(d.cast.slice(0, 8).map((c) => c.name)),
    vote_average: d.voteAverage,
    release_date: d.releaseDate,
  };

  if (existing) {
    db.prepare(
      `UPDATE titles SET title=@title, year=@year, overview=@overview, tagline=@tagline,
        poster_path=@poster_path, backdrop_path=@backdrop_path, genres=@genres,
        runtime=@runtime, seasons_count=@seasons_count, episodes_count=@episodes_count,
        director=@director, top_cast=@top_cast, vote_average=@vote_average,
        release_date=@release_date
       WHERE id = ${existing.id}`,
    ).run(params);
    return existing.id;
  }
  const info = db
    .prepare(
      `INSERT INTO titles (tmdb_id, media_type, title, year, overview, tagline,
        poster_path, backdrop_path, genres, runtime, seasons_count, episodes_count,
        director, top_cast, vote_average, release_date)
       VALUES (@tmdb_id, @media_type, @title, @year, @overview, @tagline,
        @poster_path, @backdrop_path, @genres, @runtime, @seasons_count, @episodes_count,
        @director, @top_cast, @vote_average, @release_date)`,
    )
    .run(params);
  return Number(info.lastInsertRowid);
}

/** Keep the FTS index in sync for one library row. */
export function reindexEntry(db: DB, libraryId: number): void {
  const row = db
    .prepare(
      `SELECT l.id, l.notes, t.title, t.overview, t.genres, t.director, t.top_cast
       FROM library l JOIN titles t ON t.id = l.title_id WHERE l.id = ?`,
    )
    .get(libraryId) as
    | {
        id: number;
        notes: string;
        title: string;
        overview: string;
        genres: string;
        director: string | null;
        top_cast: string;
      }
    | undefined;
  db.prepare("DELETE FROM library_fts WHERE rowid = ?").run(libraryId);
  if (!row) return;
  db.prepare(
    `INSERT INTO library_fts (rowid, title, overview, genres, director, top_cast, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.title,
    row.overview,
    (JSON.parse(row.genres) as string[]).join(" "),
    row.director ?? "",
    (JSON.parse(row.top_cast) as string[]).join(" "),
    row.notes,
  );
}

export async function fetchDetailsFromTmdb(
  tmdbId: number,
  mediaType: MediaType,
): Promise<TitleDetails> {
  const append =
    mediaType === "movie"
      ? "credits,similar,recommendations"
      : "credits,aggregate_credits,similar,recommendations";
  const raw = await tmdbGet<RawTmdbDetails>(`/${mediaType}/${tmdbId}`, {
    append_to_response: append,
  });
  return normalizeDetails(raw, mediaType);
}

export interface AddOptions {
  tmdbId: number;
  mediaType: MediaType;
  status?: LibraryStatus;
  rating?: number | null;
  notes?: string;
  favorite?: boolean;
  watchedAt?: string | null;
}

/** Add a TMDB title to the library (fetches + snapshots metadata). */
export async function addToLibrary(
  db: DB,
  opts: AddOptions,
): Promise<LibraryEntry> {
  const details = await fetchDetailsFromTmdb(opts.tmdbId, opts.mediaType);
  const titleId = upsertTitle(db, details);

  const existing = db
    .prepare("SELECT id FROM library WHERE title_id = ?")
    .get(titleId) as { id: number } | undefined;

  let libraryId: number;
  if (existing) {
    libraryId = existing.id;
    updateEntry(db, libraryId, {
      status: opts.status,
      rating: opts.rating,
      notes: opts.notes,
      favorite: opts.favorite,
      watchedAt: opts.watchedAt,
    });
  } else {
    const info = db
      .prepare(
        `INSERT INTO library (title_id, status, rating, notes, favorite, watched_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        titleId,
        opts.status ?? "watched",
        opts.rating ?? null,
        opts.notes ?? "",
        opts.favorite ? 1 : 0,
        opts.watchedAt ??
          (opts.status === "watchlist" ? null : new Date().toISOString().slice(0, 10)),
      );
    libraryId = Number(info.lastInsertRowid);
  }
  reindexEntry(db, libraryId);
  return getEntry(db, libraryId)!;
}

export interface UpdatePatch {
  status?: LibraryStatus;
  rating?: number | null;
  notes?: string;
  favorite?: boolean;
  watchedAt?: string | null;
}

export function updateEntry(db: DB, id: number, patch: UpdatePatch): LibraryEntry | null {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.status !== undefined) {
    sets.push("status = @status");
    params.status = patch.status;
  }
  if (patch.rating !== undefined) {
    sets.push("rating = @rating");
    params.rating = patch.rating;
  }
  if (patch.notes !== undefined) {
    sets.push("notes = @notes");
    params.notes = patch.notes;
  }
  if (patch.favorite !== undefined) {
    sets.push("favorite = @favorite");
    params.favorite = patch.favorite ? 1 : 0;
  }
  if (patch.watchedAt !== undefined) {
    sets.push("watched_at = @watchedAt");
    params.watchedAt = patch.watchedAt;
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE library SET ${sets.join(", ")} WHERE id = @id`).run(params);
    reindexEntry(db, id);
  }
  return getEntry(db, id);
}

export function removeEntry(db: DB, id: number): void {
  const row = db.prepare("SELECT title_id FROM library WHERE id = ?").get(id) as
    | { title_id: number }
    | undefined;
  if (!row) return;
  db.prepare("DELETE FROM library_fts WHERE rowid = ?").run(id);
  db.prepare("DELETE FROM library WHERE id = ?").run(id);
  // titles row (and episodes via cascade) removed too — snapshot is per-library
  db.prepare("DELETE FROM titles WHERE id = ?").run(row.title_id);
}

export function getEntry(db: DB, id: number): LibraryEntry | null {
  const l = db.prepare("SELECT * FROM library WHERE id = ?").get(id) as
    | LibraryRow
    | undefined;
  if (!l) return null;
  const t = db.prepare("SELECT * FROM titles WHERE id = ?").get(l.title_id) as TitleRow;
  return rowToEntry(t, l);
}

export function getEntryByTmdb(
  db: DB,
  tmdbId: number,
  mediaType: MediaType,
): LibraryEntry | null {
  const row = db
    .prepare(
      `SELECT l.id FROM library l JOIN titles t ON t.id = l.title_id
       WHERE t.tmdb_id = ? AND t.media_type = ?`,
    )
    .get(tmdbId, mediaType) as { id: number } | undefined;
  return row ? getEntry(db, row.id) : null;
}

export interface ListFilters {
  status?: LibraryStatus | "all" | "favorites";
  mediaType?: MediaType;
  genre?: string;
  search?: string;
  sort?: "added" | "rating" | "title" | "year" | "updated";
}

export function listLibrary(db: DB, f: ListFilters = {}): LibraryEntry[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.status && f.status !== "all" && f.status !== "favorites") {
    where.push("l.status = @status");
    params.status = f.status;
  }
  if (f.status === "favorites") where.push("l.favorite = 1");
  if (f.mediaType) {
    where.push("t.media_type = @mediaType");
    params.mediaType = f.mediaType;
  }
  if (f.genre) {
    where.push("t.genres LIKE @genre");
    params.genre = `%"${f.genre}"%`;
  }
  if (f.search) {
    where.push("(t.title LIKE @q OR t.director LIKE @q)");
    params.q = `%${f.search}%`;
  }
  const order =
    f.sort === "rating"
      ? "l.rating DESC NULLS LAST, l.updated_at DESC"
      : f.sort === "title"
        ? "t.title COLLATE NOCASE ASC"
        : f.sort === "year"
          ? "t.year DESC"
          : f.sort === "updated"
            ? "l.updated_at DESC"
            : "l.added_at DESC";

  const rows = db
    .prepare(
      `SELECT l.id as lib_id FROM library l JOIN titles t ON t.id = l.title_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ${order}`,
    )
    .all(params) as { lib_id: number }[];

  const watchedCounts = db
    .prepare(
      `SELECT title_id, SUM(watched) as w FROM episodes GROUP BY title_id`,
    )
    .all() as { title_id: number; w: number }[];
  const watchedMap = new Map(watchedCounts.map((r) => [r.title_id, r.w]));

  return rows.map((r) => {
    const e = getEntry(db, r.lib_id)!;
    if (e.mediaType === "tv") e.watchedEpisodes = watchedMap.get(e.titleId) ?? 0;
    return e;
  });
}

/** Set of tmdb ids in the library, for excluding from discovery. */
export function libraryTmdbIds(db: DB): Set<string> {
  const rows = db
    .prepare("SELECT t.tmdb_id, t.media_type FROM library l JOIN titles t ON t.id = l.title_id")
    .all() as { tmdb_id: number; media_type: string }[];
  return new Set(rows.map((r) => `${r.media_type}:${r.tmdb_id}`));
}

/* ── Episodes ────────────────────────────────────────────────────── */

export interface EpisodeRow {
  id: number;
  titleId: number;
  season: number;
  episode: number;
  name: string;
  airDate: string | null;
  runtime: number | null;
  overview: string;
  watched: boolean;
  watchedAt: string | null;
}

/** Fetch all seasons from TMDB and upsert episodes, preserving watch state. */
export async function syncEpisodes(db: DB, titleId: number): Promise<void> {
  const t = db.prepare("SELECT * FROM titles WHERE id = ?").get(titleId) as
    | TitleRow
    | undefined;
  if (!t || t.media_type !== "tv") return;

  const details = await tmdbGet<RawTmdbDetails>(`/tv/${t.tmdb_id}`, {});
  const seasonNumbers = (details.seasons ?? [])
    .filter((s) => s.season_number > 0)
    .map((s) => s.season_number);

  const upsert = db.prepare(
    `INSERT INTO episodes (title_id, season, episode, name, air_date, runtime, overview)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(title_id, season, episode)
     DO UPDATE SET name = excluded.name, air_date = excluded.air_date,
                   runtime = excluded.runtime, overview = excluded.overview`,
  );

  for (const n of seasonNumbers) {
    const season = await tmdbGet<RawSeason>(`/tv/${t.tmdb_id}/season/${n}`, {});
    const eps = normalizeSeason(season);
    const insertAll = db.transaction(() => {
      for (const e of eps) {
        upsert.run(titleId, e.season, e.episode, e.name, e.airDate, e.runtime, e.overview);
      }
    });
    insertAll();
  }
}

export function listEpisodes(db: DB, titleId: number): EpisodeRow[] {
  const rows = db
    .prepare(
      "SELECT * FROM episodes WHERE title_id = ? ORDER BY season, episode",
    )
    .all(titleId) as {
    id: number;
    title_id: number;
    season: number;
    episode: number;
    name: string;
    air_date: string | null;
    runtime: number | null;
    overview: string;
    watched: number;
    watched_at: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    titleId: r.title_id,
    season: r.season,
    episode: r.episode,
    name: r.name,
    airDate: r.air_date,
    runtime: r.runtime,
    overview: r.overview,
    watched: !!r.watched,
    watchedAt: r.watched_at,
  }));
}

export function setEpisodeWatched(db: DB, episodeId: number, watched: boolean): void {
  db.prepare(
    "UPDATE episodes SET watched = ?, watched_at = ? WHERE id = ?",
  ).run(watched ? 1 : 0, watched ? new Date().toISOString().slice(0, 10) : null, episodeId);
}

export function setSeasonWatched(
  db: DB,
  titleId: number,
  season: number,
  watched: boolean,
): void {
  db.prepare(
    "UPDATE episodes SET watched = ?, watched_at = ? WHERE title_id = ? AND season = ?",
  ).run(
    watched ? 1 : 0,
    watched ? new Date().toISOString().slice(0, 10) : null,
    titleId,
    season,
  );
}

/* ── Stats ───────────────────────────────────────────────────────── */

export interface LibraryStats {
  total: number;
  watched: number;
  watching: number;
  watchlist: number;
  favorites: number;
  movies: number;
  shows: number;
  avgRating: number | null;
  ratedCount: number;
  estimatedHours: number;
  episodesWatched: number;
}

export function libraryStats(db: DB): LibraryStats {
  const one = <T>(sql: string): T =>
    db.prepare(sql).get() as T;

  const counts = one<{
    total: number;
    watched: number;
    watching: number;
    watchlist: number;
    favorites: number;
  }>(`SELECT COUNT(*) total,
      SUM(status = 'watched') watched,
      SUM(status = 'watching') watching,
      SUM(status = 'watchlist') watchlist,
      SUM(favorite) favorites
      FROM library`);

  const types = one<{ movies: number; shows: number }>(
    `SELECT SUM(t.media_type = 'movie') movies, SUM(t.media_type = 'tv') shows
     FROM library l JOIN titles t ON t.id = l.title_id`,
  );

  const rating = one<{ avg: number | null; n: number }>(
    "SELECT AVG(rating) avg, COUNT(rating) n FROM library WHERE rating IS NOT NULL",
  );

  const movieMinutes = one<{ m: number | null }>(
    `SELECT SUM(t.runtime) m FROM library l JOIN titles t ON t.id = l.title_id
     WHERE t.media_type = 'movie' AND l.status IN ('watched','watching')`,
  );

  const epWatched = one<{ n: number; m: number | null }>(
    "SELECT COUNT(*) n, SUM(COALESCE(runtime, 42)) m FROM episodes WHERE watched = 1",
  );

  return {
    total: counts.total ?? 0,
    watched: counts.watched ?? 0,
    watching: counts.watching ?? 0,
    watchlist: counts.watchlist ?? 0,
    favorites: counts.favorites ?? 0,
    movies: types.movies ?? 0,
    shows: types.shows ?? 0,
    avgRating: rating.avg ? Math.round(rating.avg * 10) / 10 : null,
    ratedCount: rating.n ?? 0,
    estimatedHours: Math.round(((movieMinutes.m ?? 0) + (epWatched.m ?? 0)) / 60),
    episodesWatched: epWatched.n ?? 0,
  };
}

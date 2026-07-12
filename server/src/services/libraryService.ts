import type { DB } from "../db/connection.js";
import { env } from "../env.js";
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
  tags: string[];
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
  tags: string;
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
    tags: JSON.parse(l.tags || "[]"),
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
      `SELECT l.id, l.notes, l.tags, t.title, t.overview, t.genres, t.director, t.top_cast
       FROM library l JOIN titles t ON t.id = l.title_id WHERE l.id = ?`,
    )
    .get(libraryId) as
    | {
        id: number;
        notes: string;
        tags: string;
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
    `INSERT INTO library_fts (rowid, title, overview, genres, director, top_cast, notes, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.title,
    row.overview,
    (JSON.parse(row.genres) as string[]).join(" "),
    row.director ?? "",
    (JSON.parse(row.top_cast) as string[]).join(" "),
    row.notes,
    (JSON.parse(row.tags || "[]") as string[]).join(" "),
  );
}

export async function fetchDetailsFromTmdb(
  tmdbId: number,
  mediaType: MediaType,
): Promise<TitleDetails> {
  const append =
    mediaType === "movie"
      ? "credits,similar,recommendations,videos,images,watch/providers"
      : "credits,aggregate_credits,similar,recommendations,videos,images,watch/providers";
  const raw = await tmdbGet<RawTmdbDetails>(`/${mediaType}/${tmdbId}`, {
    append_to_response: append,
    include_image_language: "en,null",
  });
  return normalizeDetails(raw, mediaType, env.watchRegion);
}

export interface AddOptions {
  tmdbId: number;
  mediaType: MediaType;
  status?: LibraryStatus;
  rating?: number | null;
  notes?: string;
  tags?: string[];
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
    .prepare("SELECT id, status FROM library WHERE title_id = ?")
    .get(titleId) as { id: number; status: LibraryStatus } | undefined;

  let libraryId: number;
  if (existing) {
    libraryId = existing.id;
    // Upgrade-only status semantics: a re-add must never downgrade real
    // history (e.g. a stale quick-save sending "watchlist" over "watched").
    const rank: Record<LibraryStatus, number> = {
      watchlist: 0,
      watching: 1,
      abandoned: 1,
      watched: 2,
    };
    const incoming = opts.status;
    const statusPatch =
      incoming && rank[incoming] > rank[existing.status]
        ? incoming
        : undefined;
    updateEntry(db, libraryId, {
      status: statusPatch,
      rating: opts.rating,
      notes: opts.notes,
      tags: opts.tags,
      favorite: opts.favorite,
      watchedAt: opts.watchedAt,
    });
  } else {
    const info = db
      .prepare(
        `INSERT INTO library (title_id, status, rating, notes, tags, favorite, watched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        titleId,
        opts.status ?? "watched",
        opts.rating ?? null,
        opts.notes ?? "",
        JSON.stringify(normalizeTags(opts.tags ?? [])),
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
  tags?: string[];
  favorite?: boolean;
  watchedAt?: string | null;
}

/** lowercase, trim, dedupe, cap length + count */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 32);
    if (t) seen.add(t);
    if (seen.size >= 20) break;
  }
  return [...seen];
}

export function updateEntry(db: DB, id: number, patch: UpdatePatch): LibraryEntry | null {
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  if (patch.status !== undefined) {
    sets.push("status = @status");
    params.status = patch.status;
    // Marking something watched should record when — unless caller says so.
    if (patch.status === "watched" && patch.watchedAt === undefined) {
      sets.push("watched_at = COALESCE(watched_at, date('now'))");
    }
  }
  if (patch.rating !== undefined) {
    sets.push("rating = @rating");
    params.rating = patch.rating;
  }
  if (patch.notes !== undefined) {
    sets.push("notes = @notes");
    params.notes = patch.notes;
  }
  if (patch.tags !== undefined) {
    sets.push("tags = @tags");
    params.tags = JSON.stringify(normalizeTags(patch.tags));
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
  const remove = db.transaction(() => {
    db.prepare("DELETE FROM library_fts WHERE rowid = ?").run(id);
    db.prepare("DELETE FROM library WHERE id = ?").run(id);
    // titles row (and episodes via cascade) removed too — snapshot is per-library
    db.prepare("DELETE FROM titles WHERE id = ?").run(row.title_id);
  });
  remove();
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
  tag?: string;
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
  if (f.tag) {
    where.push("l.tags LIKE @tag");
    params.tag = `%"${f.tag.toLowerCase()}"%`;
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

  // Single JOIN (no per-row getEntry) — stays fast on large libraries.
  const rows = db
    .prepare(
      `SELECT t.*,
              l.id AS l_id, l.status AS l_status, l.rating AS l_rating,
              l.notes AS l_notes, l.tags AS l_tags, l.favorite AS l_favorite,
              l.watched_at AS l_watched_at, l.added_at AS l_added_at,
              l.updated_at AS l_updated_at
       FROM library l JOIN titles t ON t.id = l.title_id
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY ${order}`,
    )
    .all(params) as (TitleRow & {
    l_id: number;
    l_status: LibraryStatus;
    l_rating: number | null;
    l_notes: string;
    l_tags: string;
    l_favorite: number;
    l_watched_at: string | null;
    l_added_at: string;
    l_updated_at: string;
  })[];

  const tvTitleIds = rows.filter((r) => r.media_type === "tv").map((r) => r.id);
  const watchedMap = new Map<number, number>();
  if (tvTitleIds.length) {
    const placeholders = tvTitleIds.map(() => "?").join(",");
    const counts = db
      .prepare(
        `SELECT title_id, SUM(watched) AS w FROM episodes
         WHERE title_id IN (${placeholders}) GROUP BY title_id`,
      )
      .all(...tvTitleIds) as { title_id: number; w: number }[];
    for (const c of counts) watchedMap.set(c.title_id, c.w);
  }

  return rows.map((r) => {
    const e = rowToEntry(r, {
      id: r.l_id,
      title_id: r.id,
      status: r.l_status,
      rating: r.l_rating,
      notes: r.l_notes,
      tags: r.l_tags,
      favorite: r.l_favorite,
      watched_at: r.l_watched_at,
      added_at: r.l_added_at,
      updated_at: r.l_updated_at,
    });
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
  stillPath: string | null;
  voteAverage: number | null;
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
    `INSERT INTO episodes (title_id, season, episode, name, air_date, runtime, overview, still_path, vote_average)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(title_id, season, episode)
     DO UPDATE SET name = excluded.name, air_date = excluded.air_date,
                   runtime = excluded.runtime, overview = excluded.overview,
                   still_path = excluded.still_path, vote_average = excluded.vote_average`,
  );

  // Fetch seasons in parallel (bounded) — a 20-season show shouldn't mean
  // 20 serial round-trips before the tracker renders.
  const CHUNK = 6;
  for (let i = 0; i < seasonNumbers.length; i += CHUNK) {
    const chunk = seasonNumbers.slice(i, i + CHUNK);
    const seasons = await Promise.all(
      chunk.map((n) => tmdbGet<RawSeason>(`/tv/${t.tmdb_id}/season/${n}`, {})),
    );
    const insertAll = db.transaction(() => {
      for (const season of seasons) {
        for (const e of normalizeSeason(season)) {
          upsert.run(
            titleId,
            e.season,
            e.episode,
            e.name,
            e.airDate,
            e.runtime,
            e.overview,
            e.stillPath,
            e.voteAverage,
          );
        }
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
    still_path: string | null;
    vote_average: number | null;
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
    stillPath: r.still_path ?? null,
    voteAverage: r.vote_average ?? null,
    watched: !!r.watched,
    watchedAt: r.watched_at,
  }));
}

export function setEpisodeWatched(db: DB, episodeId: number, watched: boolean): void {
  db.prepare(
    "UPDATE episodes SET watched = ?, watched_at = ? WHERE id = ?",
  ).run(watched ? 1 : 0, watched ? new Date().toISOString().slice(0, 10) : null, episodeId);
}

/**
 * Mark everything up to (and including) a point as watched:
 * season+episode → all episodes through that one; season only → that whole
 * season and everything before it; neither → the entire show.
 * Returns how many episodes changed state.
 */
export function setWatchedUpTo(
  db: DB,
  titleId: number,
  season?: number,
  episode?: number,
): number {
  const today = new Date().toISOString().slice(0, 10);
  let where = "title_id = @titleId AND watched = 0";
  const params: Record<string, unknown> = { titleId, today };
  if (season != null && episode != null) {
    where += " AND (season < @season OR (season = @season AND episode <= @episode))";
    params.season = season;
    params.episode = episode;
  } else if (season != null) {
    where += " AND season <= @season";
    params.season = season;
  }
  const info = db
    .prepare(`UPDATE episodes SET watched = 1, watched_at = @today WHERE ${where}`)
    .run(params);
  return info.changes;
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

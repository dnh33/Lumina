import { createDb, type DB } from "../src/db/connection.js";
import {
  reindexEntry,
  upsertTitle,
  type LibraryStatus,
} from "../src/services/libraryService.js";
import type { TitleDetails } from "../src/tmdb/types.js";

export function memoryDb(): DB {
  return createDb(":memory:");
}

let nextId = 1000;

export function makeDetails(overrides: Partial<TitleDetails> = {}): TitleDetails {
  return {
    tmdbId: nextId++,
    mediaType: "movie",
    title: "Untitled",
    year: 2020,
    overview: "",
    posterPath: "/poster.jpg",
    backdropPath: "/backdrop.jpg",
    voteAverage: 7.5,
    genreIds: [],
    popularity: 10,
    tagline: "",
    genres: [],
    runtime: 120,
    seasonsCount: null,
    episodesCount: null,
    director: null,
    directorId: null,
    cast: [],
    releaseDate: "2020-01-01",
    status: "Released",
    logoPath: null,
    trailerKey: null,
    watchProviders: null,
    nextEpisodeToAir: null,
    similar: [],
    seasons: [],
    imdbId: null,
    ...overrides,
  };
}

export interface SeedOptions {
  status?: LibraryStatus;
  rating?: number | null;
  notes?: string;
  tags?: string[];
  favorite?: boolean;
  watchedAt?: string | null;
}

/** Seed a library entry without touching the network. */
export function seedEntry(
  db: DB,
  details: Partial<TitleDetails>,
  opts: SeedOptions = {},
): number {
  const d = makeDetails(details);
  const titleId = upsertTitle(db, d);
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
      JSON.stringify(opts.tags ?? []),
      opts.favorite ? 1 : 0,
      opts.watchedAt ?? "2026-01-01",
    );
  const libId = Number(info.lastInsertRowid);
  reindexEntry(db, libId);
  return libId;
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { memoryDb } from "./helpers.js";
import { ensureRatings } from "../src/services/ratingsService.js";

function seedTitle(db: ReturnType<typeof memoryDb>, opts: {
  tmdbId?: number;
  imdbId?: string | null;
  imdbRating?: number | null;
  rtRating?: number | null;
  fetchedAt?: number | null;
} = {}) {
  const id = opts.tmdbId ?? 1;
  db.prepare(
    `INSERT INTO titles (tmdb_id, media_type, title, imdb_id, imdb_rating, rt_rating, ratings_fetched_at)
     VALUES (?, 'movie', 'T', ?, ?, ?, ?)`,
  ).run(id, opts.imdbId ?? null, opts.imdbRating ?? null, opts.rtRating ?? null, opts.fetchedAt ?? null);
  return id;
}

function mockOmdb(payload: Record<string, unknown>) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => payload,
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("ratingsService", () => {
  it("parses IMDb (plain decimal) and Rotten Tomatoes (%) from OMDb", async () => {
    const env = (await import("../src/env.js")).env;
    const original = env.omdbApiKey;
    env.omdbApiKey = "dummy";
    const db = memoryDb();
    seedTitle(db, { tmdbId: 1, imdbId: "tt123" });
    // Verified live shape (OMDb, 2026-07-12): top-level imdbRating is a plain
    // decimal ("7.6"); RT lives in the Ratings[] array as "Rotten Tomatoes: 85%".
    const fetchMock = mockOmdb({
      Response: "True",
      imdbRating: "8.0",
      Ratings: [
        { Source: "Internet Movie Database", Value: "8.0/10" },
        { Source: "Rotten Tomatoes", Value: "92%" },
      ],
    });

    const scores = await ensureRatings(db, 1, "movie");

    expect(scores).toEqual({ imdb: 8.0, rt: 92 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const row = db.prepare("SELECT imdb_rating, rt_rating FROM titles WHERE tmdb_id = 1").get() as {
      imdb_rating: number;
      rt_rating: number;
    };
    expect(row.imdb_rating).toBe(8.0);
    expect(row.rt_rating).toBe(92);
    env.omdbApiKey = original;
  });

  it("skips the network when cached scores are fresh", async () => {
    const db = memoryDb();
    seedTitle(db, { tmdbId: 1, imdbId: "tt123", imdbRating: 7.5, rtRating: 80, fetchedAt: Date.now() });
    const fetchMock = mockOmdb({});
    const scores = await ensureRatings(db, 1, "movie");
    expect(scores).toEqual({ imdb: 7.5, rt: 80 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call OMDb when no API key is configured", async () => {
    const env = (await import("../src/env.js")).env;
    const original = env.omdbApiKey;
    env.omdbApiKey = "";
    const db = memoryDb();
    seedTitle(db, { tmdbId: 1, imdbId: "tt123", imdbRating: 5, rtRating: 50, fetchedAt: 0 });
    const fetchMock = mockOmdb({});
    const scores = await ensureRatings(db, 1, "movie");
    expect(scores).toEqual({ imdb: 5, rt: 50 });
    expect(fetchMock).not.toHaveBeenCalled();
    env.omdbApiKey = original;
  });

  it("falls back to cached values on OMDb failure", async () => {
    const db = memoryDb();
    seedTitle(db, { tmdbId: 1, imdbId: "tt123", imdbRating: 6, rtRating: 70, fetchedAt: 0 });
    const fetchMock = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    vi.stubGlobal("fetch", fetchMock);
    const scores = await ensureRatings(db, 1, "movie");
    expect(scores).toEqual({ imdb: 6, rt: 70 });
  });
});

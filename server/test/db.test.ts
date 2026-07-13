import { describe, expect, it } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
import { migrate } from "../src/db/schema.js";
import {
  getEntry,
  libraryStats,
  listLibrary,
  removeEntry,
  updateEntry,
} from "../src/services/libraryService.js";

describe("schema & migrations", () => {
  it("creates all core tables", () => {
    const db = memoryDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type IN ('table')")
      .all()
      .map((r) => (r as { name: string }).name);
    for (const t of [
      "titles",
      "library",
      "episodes",
      "conversations",
      "messages",
      "tmdb_cache",
      "settings",
    ]) {
      expect(tables).toContain(t);
    }
    expect(db.pragma("user_version", { simple: true })).toBeGreaterThan(0);
  });

  it("migrate() is idempotent — re-running on a drifted db (column present, version behind) does not throw", () => {
    const db = memoryDb();
    migrate(db);
    const v = db.pragma("user_version", { simple: true });
    // Simulate drift: a partial restore left the column present but the
    // version behind. The ALTER must be guarded so this doesn't crash boot.
    db.pragma("user_version = 5");
    expect(() => migrate(db)).not.toThrow();
    expect(db.pragma("user_version", { simple: true })).toBe(v);
    const cols = db
      .prepare("SELECT COUNT(*) c FROM pragma_table_info('library') WHERE name='anchor_retired'")
      .get() as { c: number };
    expect(cols.c).toBe(1);
  });

  it("v4 migration adds critics columns to titles and round-trips", () => {
    const db = memoryDb();
    const cols = db
      .prepare("PRAGMA table_info(titles)")
      .all()
      .map((r) => (r as { name: string }).name);
    for (const c of ["imdb_id", "imdb_rating", "rt_rating", "ratings_fetched_at"]) {
      expect(cols).toContain(c);
    }
    db.prepare(
      "INSERT INTO titles (tmdb_id, media_type, title, imdb_id, imdb_rating, rt_rating, ratings_fetched_at) VALUES (?,?,?,?,?,?,?)",
    ).run(1, "movie", "Test", "tt123", 8.1, 92, Date.now());
    const row = db
      .prepare("SELECT imdb_id, imdb_rating, rt_rating, ratings_fetched_at FROM titles WHERE tmdb_id = 1")
      .get() as {
      imdb_id: string;
      imdb_rating: number;
      rt_rating: number;
      ratings_fetched_at: number;
    };
    expect(row.imdb_id).toBe("tt123");
    expect(row.imdb_rating).toBe(8.1);
    expect(row.rt_rating).toBe(92);
    expect(row.ratings_fetched_at).toBeGreaterThan(0);
  });
});

describe("library service", () => {
  it("seeds, reads, updates and filters entries", () => {
    const db = memoryDb();
    const id = seedEntry(
      db,
      { title: "Dune", year: 2021, genres: ["Science Fiction", "Adventure"], director: "Denis Villeneuve" },
      { rating: 9, favorite: true, notes: "Slow-burn dread. Loved it." },
    );
    seedEntry(db, { title: "Succession", mediaType: "tv", genres: ["Drama"] }, { status: "watching" });

    const entry = getEntry(db, id)!;
    expect(entry.title).toBe("Dune");
    expect(entry.rating).toBe(9);
    expect(entry.favorite).toBe(true);
    expect(entry.genres).toContain("Science Fiction");

    const updated = updateEntry(db, id, { rating: 10, status: "watched" })!;
    expect(updated.rating).toBe(10);

    expect(listLibrary(db, { status: "watching" })).toHaveLength(1);
    expect(listLibrary(db, { mediaType: "movie" })).toHaveLength(1);
    expect(listLibrary(db, { status: "favorites" })[0].title).toBe("Dune");
    expect(listLibrary(db, { search: "villeneuve" })).toHaveLength(1);

    const stats = libraryStats(db);
    expect(stats.total).toBe(2);
    expect(stats.movies).toBe(1);
    expect(stats.shows).toBe(1);
    expect(stats.avgRating).toBe(10);
  });

  it("stores personal tags, normalizes them, and round-trips", () => {
    const db = memoryDb();
    const id = seedEntry(
      db,
      { title: "Severance", mediaType: "tv" },
      { rating: 10, favorite: true, tags: ["puzzle-box", "fast-hook"] },
    );
    expect(getEntry(db, id)!.tags).toEqual(["puzzle-box", "fast-hook"]);

    const updated = updateEntry(db, id, {
      tags: ["  Puzzle-Box ", "identity", "identity", ""],
    })!;
    expect(updated.tags).toEqual(["puzzle-box", "identity"]);
  });

  it("removes entries cleanly including FTS rows", () => {
    const db = memoryDb();
    const id = seedEntry(db, { title: "Tenet" }, { rating: 7 });
    removeEntry(db, id);
    expect(getEntry(db, id)).toBeNull();
    expect(
      db.prepare("SELECT COUNT(*) n FROM library_fts").get(),
    ).toMatchObject({ n: 0 });
    expect(db.prepare("SELECT COUNT(*) n FROM titles").get()).toMatchObject({ n: 0 });
  });

  it("sorts by critics score (composite IMDb/RT/TMDb, nulls last)", () => {
    const db = memoryDb();
    const a = seedEntry(db, { title: "Alpha", tmdbId: 101 }, { rating: 5 });
    const b = seedEntry(db, { title: "Bravo", tmdbId: 102 }, { rating: 5 });
    const c = seedEntry(db, { title: "Charlie", tmdbId: 103 }, { rating: 5 });
    // Set distinct IMDb ratings on the underlying titles rows.
    const setRating = (id: number, imdb: number) =>
      db
        .prepare(
          "UPDATE titles SET imdb_rating = ? WHERE id = (SELECT title_id FROM library WHERE id = ?)",
        )
        .run(imdb, id);
    setRating(a, 9);
    setRating(b, 4);
    setRating(c, 7);

    const ordered = listLibrary(db, { sort: "critics" }).map((e) => e.title);
    expect(ordered).toEqual(["Alpha", "Charlie", "Bravo"]);

    // Nulls sort last — wipe IMDb AND the TMDb fallback so the row is fully null
    db
      .prepare(
        "UPDATE titles SET imdb_rating = NULL, vote_average = NULL WHERE id = (SELECT title_id FROM library WHERE id = ?)",
      )
      .run(b);
    const withNull = listLibrary(db, { sort: "critics" }).map((e) => e.title);
    expect(withNull[withNull.length - 1]).toBe("Bravo");
  });
});

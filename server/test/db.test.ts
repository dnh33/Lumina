import { describe, expect, it } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
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
});

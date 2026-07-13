import { describe, expect, it } from "vitest";
import { memoryDb, makeDetails, seedEntry } from "./helpers.js";
import {
  getExcludedGenres,
  ignoredTmdbIds,
  ignoreTitle,
  listIgnored,
  setExcludedGenres,
  unignoreTitle,
  upsertTitle,
} from "../src/services/libraryService.js";
import { setRetired, isRetired } from "../src/services/anchorService.js";
import { filterCatalog, flag, upNext } from "../src/services/discoverService.js";
import { retrieveLibrary } from "../src/rag/retrieval.js";
import { computeTasteProfile } from "../src/rag/tasteProfile.js";
import type { CatalogItem } from "../src/tmdb/types.js";

function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
  return {
    tmdbId: 1,
    mediaType: "movie",
    title: "Untitled",
    year: 2020,
    overview: "",
    posterPath: null,
    backdropPath: null,
    voteAverage: 7,
    genreIds: [],
    popularity: 1,
    ...overrides,
  };
}

describe("ignored titles", () => {
  it("v5 migration creates the ignored table", () => {
    const db = memoryDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((r) => (r as { name: string }).name);
    expect(tables).toContain("ignored");
  });

  it("ignores a title, lists it, and exposes it in ignoredTmdbIds", () => {
    const db = memoryDb();
    ignoreTitle(db, 550, "movie");
    ignoreTitle(db, 550, "movie"); // idempotent
    expect(ignoredTmdbIds(db).has("movie:550")).toBe(true);
    expect(ignoredTmdbIds(db).size).toBe(1);

    const listed = listIgnored(db);
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ tmdbId: 550, mediaType: "movie" });
    // no titles snapshot → placeholder name, no poster
    expect(listed[0].title).toBe("Film #550");
    expect(listed[0].posterPath).toBeNull();
  });

  it("uses the titles snapshot for name/year/poster when available", () => {
    const db = memoryDb();
    upsertTitle(
      db,
      makeDetails({ tmdbId: 1399, mediaType: "tv", title: "Game of Thrones", year: 2011 }),
    );
    ignoreTitle(db, 1399, "tv");
    const [entry] = listIgnored(db);
    expect(entry.title).toBe("Game of Thrones");
    expect(entry.year).toBe(2011);
    expect(entry.posterPath).toBe("/poster.jpg");
  });

  it("unignore removes the entry and prunes orphan title snapshots", () => {
    const db = memoryDb();
    upsertTitle(db, makeDetails({ tmdbId: 42, title: "Orphan" }));
    ignoreTitle(db, 42, "movie");
    unignoreTitle(db, 42, "movie");
    expect(ignoredTmdbIds(db).size).toBe(0);
    expect(listIgnored(db)).toHaveLength(0);
    expect(
      db.prepare("SELECT COUNT(*) n FROM titles WHERE tmdb_id = 42").get(),
    ).toMatchObject({ n: 0 });
  });

  it("unignore keeps the titles row when it belongs to a library entry", () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 77, title: "Kept" });
    ignoreTitle(db, 77, "movie");
    unignoreTitle(db, 77, "movie");
    expect(
      db.prepare("SELECT COUNT(*) n FROM titles WHERE tmdb_id = 77").get(),
    ).toMatchObject({ n: 1 });
  });
});

describe("excluded genres (settings)", () => {
  it("round-trips genre ids and defaults to empty", () => {
    const db = memoryDb();
    expect(getExcludedGenres(db)).toEqual([]);
    setExcludedGenres(db, [27, 10770, 27]);
    expect(getExcludedGenres(db)).toEqual([27, 10770]);
    setExcludedGenres(db, []);
    expect(getExcludedGenres(db)).toEqual([]);
  });
});

describe("filterCatalog", () => {
  it("drops ignored items and marks survivors ignored: false", () => {
    const db = memoryDb();
    ignoreTitle(db, 2, "movie");
    ignoreTitle(db, 3, "tv");
    const items = [
      item({ tmdbId: 1 }),
      item({ tmdbId: 2 }),
      item({ tmdbId: 3, mediaType: "tv" }),
      item({ tmdbId: 2, mediaType: "tv" }), // same id, other medium — kept
    ];
    const kept = filterCatalog(db, items);
    expect(kept.map((i) => `${i.mediaType}:${i.tmdbId}`)).toEqual([
      "movie:1",
      "tv:2",
    ]);
    expect(kept.every((i) => i.ignored === false)).toBe(true);
  });

  it("drops items whose genres intersect excludedGenres", () => {
    const db = memoryDb();
    const items = [
      item({ tmdbId: 1, genreIds: [27, 53] }), // horror thriller — dropped
      item({ tmdbId: 2, genreIds: [18] }), // drama — kept
      item({ tmdbId: 3, genreIds: [] }), // no genres — kept
    ];
    const kept = filterCatalog(db, items, { excludedGenres: [27] });
    expect(kept.map((i) => i.tmdbId)).toEqual([2, 3]);
  });

  it("applies both filters together", () => {
    const db = memoryDb();
    ignoreTitle(db, 1, "movie");
    const kept = filterCatalog(
      db,
      [item({ tmdbId: 1 }), item({ tmdbId: 2, genreIds: [99] }), item({ tmdbId: 3 })],
      { excludedGenres: [99] },
    );
    expect(kept.map((i) => i.tmdbId)).toEqual([3]);
  });
});

describe("ignored titles are invisible to the AI layer", () => {
  it("retrieveLibrary drops ignored library entries", () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 78, title: "Blade Runner" }, { rating: 9 });
    seedEntry(db, { tmdbId: 335984, title: "Blade Runner 2049" }, { rating: 8 });

    const before = retrieveLibrary(db, "blade runner", 5);
    expect(before.map((e) => e.tmdbId)).toContain(78);

    ignoreTitle(db, 78, "movie");
    const after = retrieveLibrary(db, "blade runner", 5);
    expect(after.map((e) => e.tmdbId)).not.toContain(78);
    expect(after.map((e) => e.tmdbId)).toContain(335984);
  });

  it("computeTasteProfile excludes ignored entries everywhere", () => {
    const db = memoryDb();
    seedEntry(
      db,
      { tmdbId: 78, title: "Blade Runner", genres: ["Sci-Fi", "Noir"] },
      { rating: 9, favorite: true },
    );
    seedEntry(
      db,
      { tmdbId: 550, title: "Fight Club", genres: ["Drama"] },
      { rating: 8 },
    );

    const before = computeTasteProfile(db);
    expect(before.librarySize).toBe(2);
    expect(before.lovedTitles.map((t) => t.title)).toContain("Blade Runner");

    ignoreTitle(db, 78, "movie");
    const after = computeTasteProfile(db);
    expect(after.librarySize).toBe(1);
    expect(after.lovedTitles.map((t) => t.title)).not.toContain("Blade Runner");
    expect(after.topGenres.map((g) => g.name)).not.toContain("Sci-Fi");
  });

  it("flag drops ignored catalog items (discover_titles path)", () => {
    const db = memoryDb();
    ignoreTitle(db, 2, "movie");
    const kept = flag(db, [item({ tmdbId: 1 }), item({ tmdbId: 2 })]);
    expect(kept.map((i) => i.tmdbId)).toEqual([1]);
    expect(kept[0].inLibrary).toBe(false);
  });

  it("upNext skips a watching entry that is also ignored", () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 90, title: "Visible" }, { status: "watching" });
    seedEntry(db, { tmdbId: 91, title: "Hidden" }, { status: "watching" });
    ignoreTitle(db, 91, "movie");
    const titles = upNext(db).map((i) => i.entry.title);
    expect(titles).toContain("Visible");
    expect(titles).not.toContain("Hidden");
  });
});

describe("retire-as-anchor", () => {
  it("retires and unretires a library entry independently of ignore", () => {
    const db = memoryDb();
    const libId = seedEntry(
      db,
      { tmdbId: 7, mediaType: "movie", title: "LOTR" },
      { rating: 10, favorite: true },
    );
    expect(isRetired(db, 7, "movie")).toBe(false);

    setRetired(db, libId, true);
    expect(isRetired(db, 7, "movie")).toBe(true);

    setRetired(db, libId, false);
    expect(isRetired(db, 7, "movie")).toBe(false);

    // independent of ignore: a retired title is NOT ignored
    expect(ignoredTmdbIds(db).has("movie:7")).toBe(false);
  });
});

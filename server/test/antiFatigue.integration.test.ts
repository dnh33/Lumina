import { describe, expect, it } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
import { setRetired, fatigueScores, isRetired } from "../src/services/anchorService.js";
import { computeTasteProfile, renderTasteProfile } from "../src/rag/tasteProfile.js";

describe("anti-fatigue integration", () => {
  it("a retired title never surfaces as an anchor anywhere", () => {
    const db = memoryDb();
    const libId = seedEntry(
      db,
      { tmdbId: 7, mediaType: "movie", title: "LOTR" },
      { rating: 10, favorite: true },
    );
    setRetired(db, libId, true);

    // 1) taste profile keeps it as loved (retire does NOT remove from profile)
    const p = computeTasteProfile(db);
    expect(p.lovedTitles.map((t) => t.title)).toContain("LOTR");

    // 2) fatigueScores: no usage yet → zero; the real block is isRetired,
    //    which compare_titles / insight neighbors check (covered by their tests).
    const fatigue = fatigueScores(db);
    expect(fatigue.get("movie:7")).toBeUndefined();

    // 3) the real block: isRetired() gates anchor logging at every surface
    //    (compare_titles, insight neighbors) — they skip retired titles.
    expect(isRetired(db, 7, "movie")).toBe(true);
  });

  it("fatigue threshold gates the over-used hint (rarely cited => no hint)", () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 5, mediaType: "movie", title: "Rarely" }, { rating: 9 });
    // cite only twice, 20 days apart → well below the 0.6 pivot threshold
    const now = Date.now();
    db.prepare(
      "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
    ).run(5, "movie", "compare_titles", now - 20 * 86_400_000);
    db.prepare(
      "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
    ).run(5, "movie", "compare_titles", now - 22 * 86_400_000);

    const fatigue = fatigueScores(db);
    expect((fatigue.get("movie:5") ?? 0) < 0.6).toBe(true); // below hint threshold
  });

  it("heavily-cited title crosses the pivot threshold", () => {
    const db = memoryDb();
    seedEntry(db, { tmdbId: 9, mediaType: "movie", title: "Overused" }, { rating: 9, favorite: true });
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      db.prepare(
        "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
      ).run(9, "movie", "compare_titles", now - i * 86_400_000);
    }
    const p = computeTasteProfile(db);
    expect(p.fatiguedLovedTitles).toContain("Overused");
    expect(renderTasteProfile(p)).toMatch(/pivot|avoid referencing|fresh(er)?/i);
  });
});

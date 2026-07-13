import { describe, it, expect, vi } from "vitest";

const fakeDetails = (title: string, tmdbId: number) => ({
  title,
  year: 2020,
  tagline: "",
  genres: ["Drama"],
  director: "Dir",
  cast: [],
  voteAverage: 7,
  overview: "x",
  runtime: 100,
  tmdbId,
  mediaType: "movie" as const,
});

// Mock TMDB fetch so we don't hit the network.
vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async (id: number, _mt: string) => {
      if (id === 11) return fakeDetails("Fresh", 11);
      if (id === 22) return fakeDetails("Fatigued", 22);
      if (id === 33) return fakeDetails("Retired", 33);
      return fakeDetails("Title" + id, id);
    },
    getEntryByTmdb: () => null,
  };
});

import { executeTool } from "../src/llm/tools.js";
import { memoryDb, seedEntry } from "./helpers.js";
import { setRetired } from "../src/services/anchorService.js";

describe("executeTool compare_titles — anti-fatigue", () => {
  it("logs fresh candidate anchors but not retired/fatigued ones", async () => {
    const db = memoryDb();
    const retiredLibId = seedEntry(db, { tmdbId: 33, mediaType: "movie", title: "Retired" });
    setRetired(db, retiredLibId, true);
    // fatigue title 22 heavily with recent usage
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      db.prepare(
        "INSERT INTO anchor_usage (tmdb_id,media_type,surface,created_at) VALUES (?,?,?,?)",
      ).run(22, "movie", "compare_titles", now - i * 86_400_000);
    }

    const res = JSON.parse(
      await executeTool(
        db,
        "compare_titles",
        JSON.stringify({
          mood: "tense",
          candidates: [
            { tmdb_id: 11, media_type: "movie" }, // fresh -> should log
            { tmdb_id: 22, media_type: "movie" }, // fatigued -> skip log
            { tmdb_id: 33, media_type: "movie" }, // retired -> skip log
          ],
        }),
      ),
    );

    expect(res.candidates.length).toBe(3); // all still returned
    const counts = db
      .prepare("SELECT tmdb_id, COUNT(*) AS c FROM anchor_usage GROUP BY tmdb_id ORDER BY tmdb_id")
      .all() as { tmdb_id: number; c: number }[];
    expect(counts).toEqual([
      { tmdb_id: 11, c: 1 }, // fresh: logged once
      { tmdb_id: 22, c: 6 }, // fatigued: still just the 6 seeded rows
      // 33 absent: retired, never logged
    ]);
  });
});

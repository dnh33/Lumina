import { describe, it, expect, vi } from "vitest";

// P2.2: the `argument` module must NOT run its LLM (titleInsight) during
// buildGenreExperience. The rails must paint from details/ratings only; the
// argument is fetched per-title by the client AFTER paint via
// GET /insight/:type/:tmdbId. This test spies on the REAL titleInsight import
// and asserts it is never invoked for an `argument` world.

vi.mock("../src/tmdb/client.js", () => ({
  genreMap: async () =>
    new Map([
      ["documentary", 99],
      ["horror", 27],
      ["science fiction", 878],
    ]),
  tmdbGet: async (_path: string, params: Record<string, string> = {}) => {
    const ids = String(params.with_genres ?? "")
      .split("|")
      .filter(Boolean)
      .map(Number);
    return {
      results: ids.flatMap((g, i) => [
        {
          id: g * 100 + i,
          title: `Title ${g}-${i}`,
          media_type: "movie",
          genre_ids: [g],
          poster_path: "/p.jpg",
          release_date: "2019-05-01",
          vote_average: 8.1,
          overview: "",
          popularity: 5,
        },
      ]),
    };
  },
}));

// Mock the LLM seam; if titleInsight were really invoked it would hit this.
// We assert it is NOT invoked, so the shape here is irrelevant — only that we
// can detect the call.
vi.mock("../src/llm/openrouter.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/llm/openrouter.js")>();
  return {
    ...actual,
    getLlm: () => ({
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify({ hook: "x" }) } }],
          }),
        },
      },
    }),
    currentModel: () => "test-model",
  };
});

vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async (_id: number, _mt: string) => ({
      tmdbId: _id,
      mediaType: _mt,
      title: "Test Title",
      year: 2020,
      tagline: "",
      genres: ["Documentary"],
      director: "Test Director",
      directorId: 777,
      cast: [],
      voteAverage: 7,
      overview: "A sharp, necessary film.",
      watchProviders: { flatrate: [{ provider_name: "Netflix" }] },
      originCountry: ["US", "GB"],
      seasons: [{ seasonNumber: 1, name: "Season 1", episodeCount: 10 }],
    }),
  };
});

vi.mock("../src/services/ratingsService.js", () => ({
  ensureRatings: async () => ({ imdb: 8.2, rt: 90 }),
}));

vi.mock("../src/rag/retrieval.js", () => ({
  retrieveLibrary: () => [],
}));

import { memoryDb } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";
import { titleInsight } from "../src/llm/insightService.js";

describe("genreExperience lazy argument enrichment (P2.2)", () => {
  it("does NOT call titleInsight for an `argument` world; details/ratings still resolve", async () => {
    const spy = vi.spyOn(
      await import("../src/llm/insightService.js"),
      "titleInsight",
    );

    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      mode: "self",
      mediaType: "movie",
      genres: ["documentary"],
      modules: ["argument", "maker", "critic"],
    });

    // Non-LLM enrichment (details + ratings) MUST still run.
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].enrichment?.director).toBe("Test Director");
    expect(res.items[0].enrichment?.imdbRating).toBe(8.2);

    // The LLM argument branch must be deferred — no titleInsight per title.
    expect(res.items[0].enrichment?.argument).toBeUndefined();
    expect(titleInsight).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it("resolves quickly even with many items (no per-title LLM fan-out)", async () => {
    const db = memoryDb();
    const start = Date.now();
    const res = await buildGenreExperience(db, {
      mode: "self",
      mediaType: "movie",
      genres: ["documentary"],
      // Only `argument` enabled — before P2.2 this would fan out N LLM calls.
      modules: ["argument"],
    });
    const elapsed = Date.now() - start;
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].enrichment?.argument).toBeUndefined();
    // No LLM: should finish well under any LLM-call budget.
    expect(elapsed).toBeLessThan(2000);
  });
});

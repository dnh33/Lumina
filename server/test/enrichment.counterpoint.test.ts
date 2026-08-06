import { describe, it, expect, vi } from "vitest";

// P2.2: the server must NOT compute the LLM `argument` (thesis + counterpoint)
// during buildGenreExperience — that used to block the rails. The `argument`
// module is now deferred to the client (GET /insight per title). This test
// verifies the server returns items WITHOUT enrichment.argument for an
// `argument`-module world, while the non-LLM enrichment (details/ratings)
// still resolves.

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

// LLM seam — would only be exercised if titleInsight were still invoked.
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

describe("enrichGenreItems counterpoint deferred to client (P2.2)", () => {
  it("defers the LLM `argument` for an `argument` module world", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      mode: "self",
      mediaType: "movie",
      genres: ["documentary"],
      modules: ["argument", "maker", "critic"],
    });

    expect(res.items.length).toBeGreaterThan(0);
    const it = res.items[0];

    // Non-LLM enrichment still resolves.
    expect(it.enrichment?.director).toBe("Test Director");
    expect(it.enrichment?.imdbRating).toBe(8.2);

    // The LLM `argument` (thesis + counterpoint) is NOT computed server-side.
    expect(it.enrichment?.argument).toBeUndefined();
  });
});

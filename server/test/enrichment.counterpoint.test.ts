import { describe, it, expect, vi } from "vitest";

// K2: the server must carry `counterpoint.tmdbId` / `counterpoint.mediaType`
// (from the LLM's InsightComparison) through the enrichment so the client
// ArgumentPanel <Link> can activate. We keep titleInsight REAL (imported from
// insightService) and mock only the network/LLM/retrieval seams, exactly like
// the existing enrich test. A valid comparison only survives assembleInsight
// when the taste profile is "rich" AND the relation is valid — so we seed a
// rich library and return a well-formed comparison from the LLM seam.

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

// One LLM seam serves BOTH the curator intro and the real titleInsight call.
vi.mock("../src/llm/openrouter.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/llm/openrouter.js")>();
  return {
    ...actual,
    getLlm: () => ({
      chat: {
        completions: {
          create: async (req: any) => {
            const dump = JSON.stringify(req?.messages ?? "");
            if (dump.includes("## The user's taste profile")) {
              // This branch is the REAL titleInsight call. Return a comparison
              // that carries tmdbId + mediaType so assembleInsight keeps it.
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        verdict: "yes",
                        matchScore: 9,
                        comparisons: [
                          {
                            tmdbId: 550,
                            mediaType: "movie",
                            title: "Fight Club",
                            year: 1999,
                            relation: "diverges",
                          },
                        ],
                        hook: "A sharply argued doc.",
                        text: "A sharp, necessary film.",
                        followups: [],
                      }),
                    },
                  },
                ],
              };
            }
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      hook: "Step into the archive.",
                      tone: "hushed",
                      basedOn: [],
                    }),
                  },
                },
              ],
            };
          },
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

// retrieveLibrary is used by the REAL titleInsight (neighbor anchors); return
// [] so comparisons come strictly from the LLM seam, not the library.
vi.mock("../src/rag/retrieval.js", () => ({
  retrieveLibrary: () => [],
}));

import { memoryDb, seedEntry, makeDetails } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";

describe("enrichGenreItems counterpoint tmdbId/mediaType (K2)", () => {
  it("carries counterpoint.tmdbId (number) and mediaType through enrichment", async () => {
    const db = memoryDb();

    // Seed a "rich" library so assembleInsight keeps the LLM comparison.
    for (let i = 0; i < 8; i++) {
      seedEntry(
        db,
        makeDetails({
          tmdbId: 500 + i,
          mediaType: "movie",
          genres: ["Documentary"],
        }),
        { rating: 10, favorite: true, status: "watched" },
      );
    }

    const res = await buildGenreExperience(db, {
      mode: "self",
      mediaType: "movie",
      genres: ["documentary"],
      modules: ["argument"],
    });

    // Enrichment must have actually run.
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].enrichment?.argument?.thesis).toMatch(/sharp/i);

    // At least one item's counterpoint must carry a numeric tmdbId + mediaType.
    const withCounter = res.items.filter(
      (it) => it.enrichment?.argument?.counterpoint != null,
    );
    expect(withCounter.length).toBeGreaterThan(0);

    const cp = withCounter[0].enrichment!.argument!.counterpoint!;
    expect(typeof cp.tmdbId).toBe("number");
    expect(cp.tmdbId).toBe(550);
    expect(cp.mediaType === "movie" || cp.mediaType === "tv").toBe(true);
    expect(cp.mediaType).toBe("movie");
    expect(cp.title).toBe("Fight Club");
  });
});

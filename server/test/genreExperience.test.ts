import { describe, it, expect, vi } from "vitest";

// Mock TMDB so tests never touch the network. tmdbGet echoes back items
// carrying exactly the genre ids that were asked for, so genre plumbing
// (slug -> id -> with_genres -> genre_ids) is exercised end to end.
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

// Mock the LLM curator; keep getSetting/setSetting real for the cache path.
vi.mock("../src/llm/openrouter.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/llm/openrouter.js")>();
  return {
    ...actual,
    getLlm: () => ({
      chat: {
        completions: {
          create: async () => ({
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
          }),
        },
      },
    }),
    currentModel: () => "test-model",
  };
});

// Mock detail/ratings/insight so enrichment runs offline and is deterministic.
vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async (_id: number, _mt: string) => ({
      director: "Test Director",
      directorId: 777,
      watchProviders: { flatrate: [{ provider_name: "Netflix" }] },
      originCountry: ["US", "GB"],
      seasons: [{ seasonNumber: 1, name: "Season 1", episodeCount: 10 }],
    }),
  };
});
vi.mock("../src/services/ratingsService.js", () => ({
  ensureRatings: async () => ({ imdb: 8.2, rt: 90 }),
}));
vi.mock("../src/llm/insightService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/llm/insightService.js")>();
  return {
    ...actual,
    profileStateOf: actual.profileStateOf,
    titleInsight: async () => ({
      text: "A sharp, necessary film.",
      hook: "A sharply argued doc.",
      verdict: "yes",
      matchScore: 9,
      comparisons: [{ title: "Counter Title", relation: "contrasts with" }],
      followups: [],
      profileState: "rich",
      cached: false,
      model: "test",
    }),
  };
});

import { memoryDb, seedEntry, makeDetails } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";
import { setExcludedGenres } from "../src/services/libraryService.js";

describe("buildGenreExperience", () => {
  it("seeds from an explicit genre slug, not top-3", async () => {
    const db = memoryDb();
    seedEntry(db, makeDetails({ tmdbId: 1, mediaType: "movie", genres: ["Documentary"] }));
    const res = await buildGenreExperience(db, { genres: ["documentary"], mediaType: "movie" });
    expect(res.genres).toEqual(["documentary"]);
    expect(res.items.length).toBeGreaterThan(0);
  });

  it("G2: excludes ignored/genre-excluded titles (flag applied)", async () => {
    const db = memoryDb();
    seedEntry(db, makeDetails({ tmdbId: 2, mediaType: "movie", genres: ["Horror"] }));
    seedEntry(db, makeDetails({ tmdbId: 3, mediaType: "movie", genres: ["Horror"] }));
    setExcludedGenres(db, [27]);
    const res = await buildGenreExperience(db, { genres: ["horror"], mediaType: "movie" });
    expect(res.items.every((i) => !i.genreIds.some((g) => [27].includes(g)))).toBe(true);
  });

  it("multi-genre via '+' is OR-combined", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, { genres: ["sci-fi", "horror"], mediaType: "movie" });
    expect(res.genres).toEqual(["sci-fi", "horror"]);
  });

  it("G3: never logs anchors at selection time", async () => {
    const db = memoryDb();
    seedEntry(db, makeDetails({ tmdbId: 4, mediaType: "movie", genres: ["Documentary"] }), {
      rating: 10,
      favorite: true,
    });
    await buildGenreExperience(db, { genres: ["documentary"], mediaType: "movie" });
    const rows = db.prepare("SELECT COUNT(*) AS n FROM anchor_usage").get() as { n: number };
    expect(rows.n).toBe(0);
  });
});

describe("buildGenreExperience enrichment (v1.5 modules)", () => {
  it("populates director/geo/argument when modules enabled", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      genres: ["documentary"],
      mediaType: "tv",
      modules: ["maker", "geo", "argument", "critic", "watchorder"],
    });
    expect(res.items.length).toBeGreaterThan(0);
    const it = res.items[0];
    expect(it.enrichment?.director).toBe("Test Director");
    expect(it.enrichment?.originCountry).toEqual(["US", "GB"]);
    // P2.2: the LLM `argument` is DEFERRED to the client (GET /insight), so it
    // is undefined server-side even though the module is enabled.
    expect(it.enrichment?.argument).toBeUndefined();
    expect(it.enrichment?.imdbRating).toBe(8.2);
    expect(it.enrichment?.seasons?.[0]?.episodeCount).toBe(10);
  });

  it("does NOT enrich when no enrichment-driving modules are enabled", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      genres: ["documentary"],
      mediaType: "movie",
      modules: ["timeline"],
    });
    expect(res.items[0].enrichment).toBeUndefined();
  });
});

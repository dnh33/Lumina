import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock TMDB so tests never touch the network.
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

// Track LLM calls so we can prove caching avoids re-calling the curator.
const llmCreate = vi.fn(async () => ({
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
}));

vi.mock("../src/llm/openrouter.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/llm/openrouter.js")>();
  return {
    ...actual,
    getLlm: () => ({
      chat: { completions: { create: llmCreate } },
    }),
    currentModel: () => "test-model",
  };
});

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

import { memoryDb } from "./helpers.js";
import {
  buildGenreExperience,
  buildGenreIntro,
} from "../src/services/genreExperienceService.js";

// Count LLM curator calls per test so we can prove the cache is warm.
function curatorCallCount(): number {
  return llmCreate.mock.calls.filter(([req]) =>
    JSON.stringify(req?.messages ?? "").includes("Genres:"),
  ).length;
}

describe("buildGenreExperience (intro split out — P1.1)", () => {
  it("returns items/enrichment WITHOUT an intro field", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      genres: ["documentary"],
      mediaType: "movie",
    });
    expect(res.items.length).toBeGreaterThan(0);
    // The rails no longer wait on the LLM intro; the field is absent.
    expect(res.intro).toBeUndefined();
  });

  it("still returns the same cache key shape as before (no intro baked in)", async () => {
    const db = memoryDb();
    const res = await buildGenreExperience(db, {
      genres: ["documentary"],
      mediaType: "movie",
      mode: "self",
      modules: ["maker"],
    });
    expect(res.key).toBe("movie:self:documentary:maker");
  });
});

describe("buildGenreIntro (new endpoint — P1.1/2.3)", () => {
  beforeEach(() => llmCreate.mockClear());

  it("returns a hook string for a proof slug", async () => {
    const db = memoryDb();
    const intro = await buildGenreIntro(db, {
      genres: ["documentary"],
      mediaType: "movie",
    });
    expect(intro).not.toBeNull();
    expect(typeof intro?.hook).toBe("string");
    expect(intro?.hook.length).toBeGreaterThan(0);
  });

  it("is cache-warm: second call does not re-call the LLM curator", async () => {
    const db = memoryDb();
    await buildGenreIntro(db, { genres: ["documentary"], mediaType: "movie" });
    const first = curatorCallCount();
    expect(first).toBeGreaterThan(0);

    await buildGenreIntro(db, { genres: ["documentary"], mediaType: "movie" });
    const second = curatorCallCount();
    expect(second).toBe(first); // no NEW curator call
  });

  it("buildGenreExperience also does not call the curator (intro split)", async () => {
    const db = memoryDb();
    llmCreate.mockClear();
    await buildGenreExperience(db, { genres: ["documentary"], mediaType: "movie" });
    expect(curatorCallCount()).toBe(0);
  });
});

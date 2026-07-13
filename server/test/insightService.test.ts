import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assembleInsight,
  migrateCachedInsight,
  profileStateOf,
  titleInsight,
  type ProfileState,
} from "../src/llm/insightService.js";
import { memoryDb, seedEntry } from "./helpers.js";
import { setRetired } from "../src/services/anchorService.js";

const create = vi.fn(async () => ({
  choices: [
    {
      message: {
        content: JSON.stringify({
          verdict: "maybe",
          matchScore: 60,
          comparisons: [],
          hook: "h",
          text: "t",
          followups: [],
        }),
      },
    },
  ],
}));

vi.mock("../src/llm/openrouter.js", () => ({
  getLlm: () => ({ chat: { completions: { create } } }),
  currentModel: () => "test-model",
  getSetting: () => null,
  setSetting: () => {},
}));
vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async () => ({
      title: "X",
      year: 2020,
      tagline: "",
      genres: ["Drama"],
      director: "D",
      cast: [],
      voteAverage: 7,
      overview: "o",
      tmdbId: 999,
      mediaType: "movie",
    }),
    getEntryByTmdb: () => null,
  };
});
vi.mock("../src/rag/retrieval.js", () => ({
  retrieveLibrary: () => [
    { tmdbId: 1, mediaType: "movie", title: "Fresh", rating: 9 },
    { tmdbId: 2, mediaType: "movie", title: "Retired", rating: 10 },
  ],
}));

const ctx = (profileState: ProfileState, owned: any = null) => ({
  profileState,
  owned,
});

describe("assembleInsight", () => {
  it("parses structured JSON into TitleInsight", () => {
    const json = JSON.stringify({
      verdict: "maybe",
      matchScore: 62,
      comparisons: [
        {
          tmdbId: 1,
          mediaType: "tv",
          title: "Severance",
          year: 2022,
          relation: "echoes",
          note: "same identity pull",
        },
      ],
      hook: "Garland's existential inquiry may win you over.",
      text: "Your rapture for Severance…",
    });
    const r = assembleInsight(json, ctx("rich", null));
    expect(r.verdict).toBe("maybe");
    expect(r.matchScore).toBe(62);
    expect(r.comparisons).toHaveLength(1);
    expect(r.comparisons[0].tmdbId).toBe(1);
    expect(r.followups.length).toBeGreaterThan(0);
    expect(r.profileState).toBe("rich");
  });

  it("degrades gracefully when LLM returns prose only", () => {
    const r = assembleInsight(
      "Just some plain prose about the film.",
      ctx("rich", null),
    );
    expect(r.text).toContain("Just some plain prose");
    expect(r.verdict).toBe("maybe");
    expect(r.comparisons).toEqual([]);
    expect(Array.isArray(r.followups)).toBe(true);
  });

  it("degrades on malformed JSON", () => {
    const r = assembleInsight("{not json at all", ctx("thin", null));
    expect(typeof r.text).toBe("string");
    expect(r.matchScore).toBeNull();
    expect(r.comparisons).toEqual([]);
  });

  it("extracts JSON embedded in surrounding prose", () => {
    const raw = 'Sure! Here is the insight:\n{"verdict":"love","text":"great fit"}';
    const r = assembleInsight(raw, ctx("rich", null));
    expect(r.verdict).toBe("love");
    expect(r.text).toContain("great fit");
  });

  it("forces verdict=rewatch when owned + rated", () => {
    const r = assembleInsight(
      JSON.stringify({ verdict: "love", text: "x" }),
      ctx("rich", { status: "watched", rating: 9 }),
    );
    expect(r.verdict).toBe("rewatch");
  });

  it("omits comparisons + score when profile empty/thin", () => {
    const r = assembleInsight(
      JSON.stringify({
        verdict: "maybe",
        matchScore: 80,
        comparisons: [
          {
            tmdbId: 9,
            mediaType: "movie",
            title: "X",
            year: 2000,
            relation: "warns",
            note: "n",
          },
        ],
        text: "t",
      }),
      ctx("empty", null),
    );
    expect(r.matchScore).toBeNull();
    expect(r.comparisons).toEqual([]);
  });

  it("clamps matchScore into 0-100 and caps comparisons at 3", () => {
    const r = assembleInsight(
      JSON.stringify({
        verdict: "maybe",
        matchScore: 250,
        comparisons: Array.from({ length: 5 }, (_, i) => ({
          tmdbId: i,
          mediaType: "movie",
          title: `T${i}`,
          year: 2000,
          relation: "echoes",
          note: "n",
        })),
        text: "t",
      }),
      ctx("rich", null),
    );
    expect(r.matchScore).toBe(100);
    expect(r.comparisons).toHaveLength(3);
  });

  it("drops comparisons with unknown relation", () => {
    const r = assembleInsight(
      JSON.stringify({
        verdict: "maybe",
        comparisons: [
          { tmdbId: 1, mediaType: "movie", title: "Ok", relation: "weird", note: "n" },
        ],
        text: "t",
      }),
      ctx("rich", null),
    );
    expect(r.comparisons).toEqual([]);
  });
});

describe("profileStateOf", () => {
  it("classifies profile state", () => {
    expect(profileStateOf({ librarySize: 0 } as any)).toBe("empty");
    expect(
      profileStateOf({
        librarySize: 3,
        ratedCount: 2,
        lovedTitles: [],
        dislikedTitles: [],
      } as any),
    ).toBe("thin");
    expect(
      profileStateOf({
        librarySize: 20,
        ratedCount: 10,
        lovedTitles: [{ title: "x" }],
        dislikedTitles: [{ title: "y" }],
      } as any),
    ).toBe("rich");
  });
});

describe("migrateCachedInsight", () => {
  it("backfills missing fields for a prose-only cached entry", () => {
    const r = migrateCachedInsight({ text: "old prose", model: "m" }, "m");
    expect(r.text).toBe("old prose");
    expect(r.verdict).toBe("maybe");
    expect(r.cached).toBe(true);
    expect(r.comparisons).toEqual([]);
    expect(r.followups.length).toBeGreaterThan(0);
  });

  it("preserves a full structured cached entry", () => {
    const full = {
      text: "t",
      verdict: "love" as const,
      matchScore: 90,
      comparisons: [],
      hook: "h",
      followups: [],
      profileState: "rich" as const,
    };
    const r = migrateCachedInsight(full, "m");
    expect(r.verdict).toBe("love");
    expect(r.matchScore).toBe(90);
  });
});

describe("generateInsight anti-fatigue neighbors", () => {
  it("excludes retired neighbors from the prompt and logs fresh ones", async () => {
    const db = memoryDb();
    const libId = seedEntry(db, { tmdbId: 2, mediaType: "movie", title: "Retired" });
    setRetired(db, libId, true);
    create.mockClear();

    await titleInsight(db, 999, "movie");

    const prompt = JSON.stringify(create.mock.calls[0][0].messages);
    const neighborSection = prompt.split("Their closest library titles")[1] ?? "";
    expect(neighborSection).toContain("Fresh"); // fresh neighbor present
    expect(neighborSection).not.toContain("Retired"); // retired excluded from neighbors
    const logged = db
      .prepare("SELECT tmdb_id FROM anchor_usage WHERE surface='take'")
      .all() as { tmdb_id: number }[];
    // Option A: only the OPENED title (999) is logged as "take" — not the
    // neighbor "Fresh" (1, logged as a comparison instead) and not the
    // retired "Retired" (2, never logged at all).
    expect(logged.map((r) => r.tmdb_id)).toEqual([999]);
    expect(logged.map((r) => r.tmdb_id)).not.toContain(2); // retired never logged
  });
});

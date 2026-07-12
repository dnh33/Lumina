import { describe, it, expect } from "vitest";
import {
  assembleInsight,
  migrateCachedInsight,
  profileStateOf,
  type ProfileState,
} from "../src/llm/insightService.js";

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

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the OpenRouter client so titleInsight runs without a real LLM.
const create = vi.fn();
vi.mock("../src/llm/openrouter.js", () => ({
  getLlm: () => ({ chat: { completions: { create } } }),
  currentModel: () => "test-model",
  getSetting: () => null,
  setSetting: () => {},
}));

// Mock TMDB fetch so we don't hit the network.
vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async () => ({
      title: "Annihilation",
      year: 2018,
      tagline: "",
      genres: ["Science Fiction", "Horror"],
      director: "Alex Garland",
      cast: [],
      voteAverage: 7.0,
      overview: "A biologist signs up for a dangerous expedition.",
    }),
    getEntryByTmdb: () => null,
  };
});

// Mock retrieval: return a couple of real neighbor shapes.
vi.mock("../src/rag/retrieval.js", () => ({
  retrieveLibrary: () => [
    { tmdbId: 1, mediaType: "tv", title: "Severance", rating: 10 },
    { tmdbId: 2, mediaType: "movie", title: "Arrival", rating: 9 },
  ],
}));

import { titleInsight } from "../src/llm/insightService.js";
import { memoryDb } from "./helpers.js";
import { seedEntry } from "./helpers.js";
import type { DB } from "../src/db/connection.js";

// Real in-memory sqlite so computeTasteProfile / caching exercise the DB.
const fakeDb = memoryDb() as DB;

describe("titleInsight (wiring)", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("returns the structured shape and passes neighbors into the prompt", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
              hook: "Garland's inquiry may win you over.",
              text: "Your rapture for Severance signals this is squarely your taste.",
            }),
          },
        },
      ],
    });

    const r = await titleInsight(fakeDb, 181, "movie");

    expect(r.verdict).toBe("maybe");
    // Empty profile → matchScore null (honest: too little signal to score).
    expect(r.matchScore).toBeNull();
    // No comparisons when profile is empty/thin.
    expect(r.comparisons).toEqual([]);
    expect(r.followups.length).toBeGreaterThan(0);
    expect(r.model).toBe("test-model");
    expect(r.cached).toBe(false);

    // The neighbor list must have reached the model prompt.
    const userMsg = create.mock.calls[0][0].messages[1].content as string;
    expect(userMsg).toContain("Severance");
    expect(userMsg).toContain("tmdbId 1");
    // JSON mode requested.
    expect(create.mock.calls[0][0].response_format).toEqual({
      type: "json_object",
    });
  });

  it("populates comparisons + matchScore for a rich profile", async () => {
    // Seed ≥8 rated entries with loved/disliked signal → profileState "rich".
    for (let i = 0; i < 9; i++) {
      seedEntry(fakeDb, { tmdbId: 500 + i, title: `Seed ${i}` }, {
        status: "watched",
        rating: i === 0 ? 10 : 7, // one loved, rest neutral-positive
        favorite: i === 0,
      });
    }

    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              verdict: "love",
              matchScore: 88,
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
              hook: "Garland's inquiry may win you over.",
              text: "Your rapture for Severance signals this is squarely your taste.",
            }),
          },
        },
      ],
    });

    const r = await titleInsight(fakeDb, 181, "movie");
    expect(r.verdict).toBe("love");
    expect(r.matchScore).toBe(88);
    expect(r.comparisons).toHaveLength(1);
    expect(r.comparisons[0].tmdbId).toBe(1);
  });

  it("degrades to a safe shape when the model returns prose", async () => {
    create.mockResolvedValue({
      choices: [
        { message: { content: "Just some plain prose about the film." } },
      ],
    });

    const r = await titleInsight(fakeDb, 181, "movie");
    expect(r.text).toContain("Just some plain prose");
    expect(r.verdict).toBe("maybe");
    expect(r.comparisons).toEqual([]);
    expect(Array.isArray(r.followups)).toBe(true);
  });
});

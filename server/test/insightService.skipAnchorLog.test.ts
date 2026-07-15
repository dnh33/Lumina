import { describe, it, expect, vi } from "vitest";
import { titleInsight } from "../src/llm/insightService.js";
import { memoryDb } from "./helpers.js";

// Mirror the mocks used by insightService.test.ts so titleInsight runs without
// touching the network or real FTS retrieval.
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
  const actual =
    await importOriginal<typeof import("../src/services/libraryService.js")>();
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
    { tmdbId: 2, mediaType: "movie", title: "Other", rating: 10 },
  ],
}));

// listAnchors is not an exported helper in this codebase; the suite counts
// anchors via the raw anchor_usage table (see anchorService.test.ts).
function anchorCount(db: any): number {
  return (db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number })
    .c;
}

describe("titleInsight skipAnchorLog", () => {
  it("does NOT log anchors when skipAnchorLog=true (count unchanged)", async () => {
    const db = memoryDb();
    const before = anchorCount(db);
    await titleInsight(db, 999, "movie", false, true);
    const after = anchorCount(db);
    expect(after).toBe(before);
    expect(after).toBe(0);
  });

  it("DOES log anchors when skipAnchorLog=false (control)", async () => {
    const db = memoryDb();
    const before = anchorCount(db);
    await titleInsight(db, 999, "movie", false, false);
    const after = anchorCount(db);
    expect(after).toBeGreaterThan(before);
  });
});

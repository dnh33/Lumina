import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the OpenRouter client so titleInsight runs without a real LLM.
const create = vi.fn();
vi.mock("../src/llm/openrouter.js", () => ({
  getLlm: () => ({ chat: { completions: { create } } }),
  currentModel: () => "test-model",
  getSetting: () => null,
  setSetting: () => {},
}));

// Mock TMDB fetch + library lookup so we don't hit the network.
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

import { miscRouter } from "../src/routes/misc.js";
import { createDb, setDb, type DB } from "../src/db/connection.js";

type Handler = (
  req: unknown,
  res: unknown,
  next: () => void,
) => Promise<void>;

function findHandler(path: string): Handler | undefined {
  const stack = (
    miscRouter as unknown as {
      stack: Array<{ route?: { path: string; stack: Array<{ handle: Handler }> } }>;
    }
  ).stack;
  return stack.find((l) => l.route?.path === path)?.route?.stack[0]?.handle;
}

function mockRes() {
  const res = {
    json: vi.fn(),
    status: vi.fn(() => res),
  };
  return res;
}

function anchorCount(db: DB): number {
  return (db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number })
    .c;
}

describe("GET /api/insight/:type/:tmdbId skipAnchorLog", () => {
  let db: DB;

  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({
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
    });
    db = createDb(":memory:");
    setDb(db);
  });

  it("writes ZERO anchors when ?skipAnchorLog=1 (bulk prefetch path)", async () => {
    const handler = findHandler("/insight/:type/:tmdbId")!;
    const res = mockRes();
    await handler({ params: { type: "movie", tmdbId: "999" }, query: { skipAnchorLog: "1" } }, res, vi.fn());
    expect(res.json).toHaveBeenCalled();
    expect(anchorCount(db)).toBe(0);
  });

  it("DOES write anchors on the default path (no skipAnchorLog)", async () => {
    const handler = findHandler("/insight/:type/:tmdbId")!;
    const res = mockRes();
    await handler({ params: { type: "movie", tmdbId: "999" }, query: {} }, res, vi.fn());
    expect(res.json).toHaveBeenCalled();
    expect(anchorCount(db)).toBeGreaterThan(0);
  });
});

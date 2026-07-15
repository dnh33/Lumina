import { describe, it, expect, vi } from "vitest";

// K3: batch enrichment must NOT log "take"/"insight_neighbors" anchors.
// We keep titleInsight REAL (imported from insightService) so the
// skipAnchorLog guard in enrichGenreItems is actually exercised — only the
// network/LLM seams are mocked. A failing test here proves enrichment still
// hit the anchor table before the fix threaded skipAnchorLog=true.

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
// Distinguish by the user prompt shape: titleInsight's prompt carries the
// taste-profile block; the curator's carries "Genres:".
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
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        verdict: "yes",
                        matchScore: 9,
                        comparisons: [],
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

// retrieveLibrary is used by the REAL titleInsight (neighbor anchors) and by
// selectAnchors; return [] so enrichment reaches the anchor-log guard with a
// controlled, empty neighbor set (only the item's own "take" anchor can fire).
vi.mock("../src/rag/retrieval.js", () => ({
  retrieveLibrary: () => [],
}));

import { memoryDb } from "./helpers.js";
import { buildGenreExperience } from "../src/services/genreExperienceService.js";

function anchorCount(db: any): number {
  return (db.prepare("SELECT COUNT(*) c FROM anchor_usage").get() as { c: number })
    .c;
}

describe("enrichGenreItems anchor logging (K3)", () => {
  it("logs ZERO anchors and defers the LLM `argument` to the client (P2.2)", async () => {
    const db = memoryDb();
    const before = anchorCount(db);
    const res = await buildGenreExperience(db, {
      mode: "self",
      mediaType: "movie",
      genres: ["documentary"],
      modules: ["argument"],
    });
    const after = anchorCount(db);

    // Enrichment must have actually run (otherwise the test is vacuous) — but
    // the `argument` module is now deferred, so no per-title insight is
    // computed server-side.
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].enrichment?.argument).toBeUndefined();

    // No anchors written during the build (skipAnchorLog guard preserved).
    expect(after).toBe(before);
    expect(after).toBe(0);
  });
});

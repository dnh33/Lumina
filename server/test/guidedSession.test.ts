import { describe, it, expect, vi } from "vitest";

vi.mock("../src/services/libraryService.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/libraryService.js")>();
  return {
    ...actual,
    fetchDetailsFromTmdb: async (id: number, mt: "movie" | "tv") => ({
      tmdbId: id,
      mediaType: mt,
      title: `Mock ${id}`,
      year: 2018,
      overview: "",
      posterPath: "/p.jpg",
      backdropPath: null,
      voteAverage: 7.2,
      genreIds: [99],
      popularity: 10,
      tagline: "",
      genres: [{ id: 99, name: "Documentary" }],
      runtime: 100,
      seasonsCount: null,
      episodesCount: null,
      director: null,
      directorId: null,
      cast: [],
      releaseDate: "2018-01-01",
      status: "Released",
      logoPath: null,
      trailerKey: null,
      watchProviders: null,
      nextEpisodeToAir: null,
      similar: [],
      seasons: [],
      imdbId: null,
    }),
  };
});

import { memoryDb } from "./helpers.js";
import { getSetting } from "../src/llm/openrouter.js";
import { createConversation } from "../src/llm/chatService.js";
import {
  getOrCreateGuidedSession,
  getGuidedSession,
  peekGuidedSessionProgress,
  answerGuidedBeat,
  resetGuidedSession,
  rankForGuided,
  actOnGuidedPick,
  refreshGuidedPicks,
  picksFromItems,
  seedsForSlug,
  guidedPrefillSummary,
  linkGuidedConversation,
  findGuidedSessionByConversation,
  renderGuidedSessionContext,
  syncGuidedWatchlistFromChat,
  type GuidedRankable,
} from "../src/services/guidedSessionService.js";
import {
  assertKnownWorldSlug,
  parseGenreQueryParam,
  sanitizeGenreSlug,
} from "../src/services/worldSlug.js";

describe("guidedSessionService", () => {
  it("creates a fresh active session on first get", () => {
    const db = memoryDb();
    const s = getOrCreateGuidedSession(db, "documentary", "movie");
    expect(s.status).toBe("active");
    expect(s.answers).toEqual({});
    expect(s.picks).toEqual([]);
    const again = getOrCreateGuidedSession(db, "documentary", "movie");
    expect(again.createdAt).toBe(s.createdAt);
  });

  it("getGuidedSession / peek do not create empty settings rows", () => {
    const db = memoryDb();
    expect(getGuidedSession(db, "horror", "movie")).toBeNull();
    expect(peekGuidedSessionProgress(db, "horror")).toBeNull();
    expect(getSetting(db, "guided-session:horror:movie")).toBeNull();
    expect(getSetting(db, "guided-session:horror:tv")).toBeNull();

    getOrCreateGuidedSession(db, "horror", "movie");
    expect(getSetting(db, "guided-session:horror:movie")).toBeTruthy();
    expect(getGuidedSession(db, "horror", "movie")?.slug).toBe("horror");
  });

  it("peek prefers movie progress then surfaces TV-only tours", () => {
    const db = memoryDb();
    answerGuidedBeat(db, "anime", "tv", "tempo", "kinetic");
    const peeked = peekGuidedSessionProgress(db, "anime");
    expect(peeked?.mediaType).toBe("tv");
    expect(peeked?.answers.tempo).toBe("kinetic");
  });

  it("rejects unknown / hostile world slugs before persist", () => {
    const db = memoryDb();
    expect(() => getOrCreateGuidedSession(db, "not-a-world", "movie")).toThrow(
      /invalid world slug/,
    );
    expect(() => assertKnownWorldSlug("evil\nslug")).toThrow();
    expect(sanitizeGenreSlug("ok-slug")).toBe("ok-slug");
    expect(sanitizeGenreSlug("x".repeat(80))).toBeNull();
    expect(getSetting(db, "guided-session:not-a-world:movie")).toBeNull();
  });

  it("parseGenreQueryParam caps count and drops hostile tokens", () => {
    const many = Array.from({ length: 20 }, (_, i) => `genre-${i}`).join(",");
    expect(parseGenreQueryParam(many)).toHaveLength(8);
    expect(parseGenreQueryParam("horror,<script>,romance")).toEqual([
      "horror",
      "romance",
    ]);
  });

  it("act rejects non-positive / non-integer tmdbId", async () => {
    const db = memoryDb();
    getOrCreateGuidedSession(db, "documentary", "movie");
    for (const bad of [0, -1, 1.5, NaN]) {
      await expect(
        actOnGuidedPick(db, {
          slug: "documentary",
          mediaType: "movie",
          tmdbId: bad,
          titleMediaType: "movie",
          action: "open",
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    }
  });

  it("answers beats and completes after all three", () => {
    const db = memoryDb();
    answerGuidedBeat(db, "documentary", "movie", "tempo", "slow");
    answerGuidedBeat(db, "documentary", "movie", "era", "now");
    const done = answerGuidedBeat(db, "documentary", "movie", "risk", "stretch");
    expect(done.status).toBe("complete");
    expect(done.answers).toEqual({ tempo: "slow", era: "now", risk: "stretch" });
  });

  it("re-answers a prior dial without reset and keeps complete", () => {
    const db = memoryDb();
    answerGuidedBeat(db, "documentary", "movie", "tempo", "slow");
    answerGuidedBeat(db, "documentary", "movie", "era", "now");
    answerGuidedBeat(db, "documentary", "movie", "risk", "stretch");
    const retuned = answerGuidedBeat(db, "documentary", "movie", "tempo", "kinetic");
    expect(retuned.status).toBe("complete");
    expect(retuned.answers.tempo).toBe("kinetic");
    expect(retuned.answers.era).toBe("now");
    expect(retuned.answers.risk).toBe("stretch");

    const items: GuidedRankable[] = [
      {
        tmdbId: 1,
        mediaType: "movie",
        title: "Quiet",
        year: 2018,
        posterPath: null,
        voteAverage: 7,
        popularity: 2,
        inLibrary: false,
      },
      {
        tmdbId: 2,
        mediaType: "movie",
        title: "Loud",
        year: 2019,
        posterPath: null,
        voteAverage: 6,
        popularity: 80,
        inLibrary: false,
      },
    ];
    const rankedSlow = rankForGuided(items, {
      answers: { tempo: "slow", era: "now", risk: "stretch" },
      acted: [],
    });
    const rankedKinetic = rankForGuided(items, {
      answers: retuned.answers,
      acted: [],
    });
    expect(rankedSlow[0].tmdbId).toBe(1);
    expect(rankedKinetic[0].tmdbId).toBe(2);
  });

  it("rankForGuided prefers unwatched and applies era", () => {
    const items: GuidedRankable[] = [
      {
        tmdbId: 1,
        mediaType: "movie",
        title: "Old In Library",
        year: 1975,
        posterPath: null,
        voteAverage: 9,
        popularity: 50,
        inLibrary: true,
      },
      {
        tmdbId: 2,
        mediaType: "movie",
        title: "New Unwatched",
        year: 2018,
        posterPath: null,
        voteAverage: 6,
        popularity: 8,
        inLibrary: false,
      },
      {
        tmdbId: 3,
        mediaType: "movie",
        title: "Classic Unwatched",
        year: 1962,
        posterPath: null,
        voteAverage: 8,
        popularity: 12,
        inLibrary: false,
      },
    ];
    const ranked = rankForGuided(items, {
      answers: { era: "now", risk: "stretch", tempo: "mid" },
      acted: [],
    });
    expect(ranked[0].tmdbId).toBe(2);
  });

  it("Classic Horror shelf includes at least one world seed anchor", () => {
    const seeds = seedsForSlug("horror");
    expect(seeds.length).toBeGreaterThan(0);
    const seed = seeds[0]!;

    // Live failure mode: kinetic + comfort + in-library seed → modern pop wins.
    const items: GuidedRankable[] = [
      {
        tmdbId: 9001,
        mediaType: "movie",
        title: "The Mummy",
        year: 2026,
        posterPath: null,
        voteAverage: 6,
        popularity: 200,
        inLibrary: false,
      },
      {
        tmdbId: 9002,
        mediaType: "movie",
        title: "Passenger",
        year: 2025,
        posterPath: null,
        voteAverage: 6.5,
        popularity: 180,
        inLibrary: false,
      },
      {
        tmdbId: 9003,
        mediaType: "movie",
        title: "Sinners",
        year: 2025,
        posterPath: null,
        voteAverage: 7,
        popularity: 190,
        inLibrary: false,
      },
      {
        tmdbId: seed.tmdbId,
        mediaType: seed.mediaType,
        title: "The Thing",
        year: 1982,
        posterPath: null,
        voteAverage: 8.1,
        popularity: 40,
        inLibrary: true,
      },
    ];

    const ranked = rankForGuided(
      items,
      {
        answers: { era: "classic", tempo: "kinetic", risk: "comfort" },
        acted: [],
      },
      { slug: "horror" },
    );
    const shelf = picksFromItems(ranked, 3);
    expect(shelf.some((p) => p.tmdbId === seed.tmdbId && p.mediaType === seed.mediaType)).toBe(
      true,
    );
  });

  it("drops dismissed titles from ranking", () => {
    const items: GuidedRankable[] = [
      {
        tmdbId: 10,
        mediaType: "movie",
        title: "A",
        year: 2015,
        posterPath: null,
        voteAverage: 8,
        inLibrary: false,
      },
      {
        tmdbId: 11,
        mediaType: "movie",
        title: "B",
        year: 2016,
        posterPath: null,
        voteAverage: 7,
        inLibrary: false,
      },
    ];
    const ranked = rankForGuided(items, {
      answers: {},
      acted: [
        {
          tmdbId: 10,
          mediaType: "movie",
          action: "dismiss",
          at: new Date().toISOString(),
        },
      ],
    });
    expect(ranked.map((r) => r.tmdbId)).toEqual([11]);
  });

  it("dismiss act removes pick; watchlist flags inLibrary", async () => {
    const db = memoryDb();
    refreshGuidedPicks(db, "documentary", "movie", [
      {
        tmdbId: 501,
        mediaType: "movie",
        title: "Shelf One",
        year: 2020,
        posterPath: "/a.jpg",
        voteAverage: 7,
        inLibrary: false,
      },
      {
        tmdbId: 502,
        mediaType: "movie",
        title: "Shelf Two",
        year: 2021,
        posterPath: "/b.jpg",
        voteAverage: 6,
        inLibrary: false,
      },
    ]);
    const afterDismiss = await actOnGuidedPick(db, {
      slug: "documentary",
      mediaType: "movie",
      tmdbId: 501,
      titleMediaType: "movie",
      action: "dismiss",
    });
    expect(afterDismiss.picks.map((p) => p.tmdbId)).toEqual([502]);

    const afterWatch = await actOnGuidedPick(db, {
      slug: "documentary",
      mediaType: "movie",
      tmdbId: 502,
      titleMediaType: "movie",
      action: "watchlist",
    });
    expect(afterWatch.picks[0]?.inLibrary).toBe(true);
    expect(afterWatch.acted.some((a) => a.action === "watchlist")).toBe(true);
  });

  it("reset clears answers", () => {
    const db = memoryDb();
    answerGuidedBeat(db, "horror", "tv", "tempo", "kinetic");
    const fresh = resetGuidedSession(db, "horror", "tv");
    expect(fresh.answers).toEqual({});
    expect(fresh.status).toBe("active");
  });

  it("prefill summary names choices", () => {
    const db = memoryDb();
    answerGuidedBeat(db, "documentary", "movie", "tempo", "slow");
    const s = getOrCreateGuidedSession(db, "documentary", "movie");
    expect(guidedPrefillSummary(s)).toMatch(/Patient cut/);
  });

  it("beatsForSlug flavors Reading Room copy", async () => {
    const { beatsForSlug, metaphorForSlug } = await import(
      "../src/services/guidedSessionService.js"
    );
    expect(metaphorForSlug("documentary")).toBe("Reading Room");
    expect(beatsForSlug("documentary")[0].prompt).toMatch(/argument/i);
    expect(beatsForSlug("horror")[0].prompt).toMatch(/door/i);
    expect(beatsForSlug("unknown-genre")[0].id).toBe("tempo");
  });

  it("links conversation and finds session for RAG", () => {
    const db = memoryDb();
    const conversationId = createConversation(db, "tour");
    answerGuidedBeat(db, "documentary", "movie", "tempo", "slow");
    answerGuidedBeat(db, "documentary", "movie", "era", "now");
    const linked = linkGuidedConversation(db, "documentary", "movie", conversationId);
    expect(linked.conversationId).toBe(conversationId);
    expect(findGuidedSessionByConversation(db, conversationId)?.slug).toBe(
      "documentary",
    );
    expect(findGuidedSessionByConversation(db, 99)).toBeNull();

    const text = renderGuidedSessionContext(linked);
    expect(text).toMatch(/documentary/);
    expect(text).toMatch(/Patient cut/);
    expect(text).toMatch(/Tour beats/);
  });

  it("link rejects missing conversation ids", () => {
    const db = memoryDb();
    getOrCreateGuidedSession(db, "documentary", "movie");
    expect(() => linkGuidedConversation(db, "documentary", "movie", 404)).toThrow(
      /Conversation not found/,
    );
    try {
      linkGuidedConversation(db, "documentary", "movie", 404);
    } catch (err) {
      expect((err as { statusCode?: number }).statusCode).toBe(404);
    }
  });

  it("syncGuidedWatchlistFromChat mirrors shelf inLibrary on linked chat", () => {
    const db = memoryDb();
    const conversationId = createConversation(db, "sync");
    linkGuidedConversation(db, "documentary", "movie", conversationId);
    refreshGuidedPicks(db, "documentary", "movie", [
      {
        tmdbId: 900,
        mediaType: "movie",
        title: "Chat Pick",
        year: 2022,
        posterPath: null,
        voteAverage: 7,
        inLibrary: false,
      },
    ]);
    const synced = syncGuidedWatchlistFromChat(db, conversationId, 900, "movie");
    expect(synced?.picks[0]?.inLibrary).toBe(true);
    expect(synced?.acted.some((a) => a.action === "watchlist" && a.tmdbId === 900)).toBe(
      true,
    );
    expect(syncGuidedWatchlistFromChat(db, 999, 900, "movie")).toBeNull();
  });
});

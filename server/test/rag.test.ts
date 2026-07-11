import { describe, expect, it } from "vitest";
import { memoryDb, seedEntry } from "./helpers.js";
import { retrieveLibrary, toFtsQuery } from "../src/rag/retrieval.js";
import {
  computeTasteProfile,
  renderTasteProfile,
} from "../src/rag/tasteProfile.js";
import { buildChatContext } from "../src/rag/contextBuilder.js";
import { indexMessage, retrieveMemory } from "../src/rag/memory.js";
import { createConversation, persistMessage } from "../src/llm/chatService.js";

describe("FTS query builder", () => {
  it("builds prefix OR queries and strips dangerous tokens", () => {
    expect(toFtsQuery("slow-burn sci-fi dread")).toContain('"slow"*');
    expect(toFtsQuery('drop "table"; --')).not.toContain(";");
    expect(toFtsQuery("a an of")).toBe(""); // too-short tokens dropped
  });
});

describe("RAG layer 2 — library retrieval", () => {
  it("finds entries by title, genre, people and notes; boosts favorites", () => {
    const db = memoryDb();
    seedEntry(
      db,
      { title: "Dune", genres: ["Science Fiction"], director: "Denis Villeneuve", overview: "A noble house battles for a desert planet." },
      { rating: 9, favorite: true, notes: "slow-burn dread, gorgeous" },
    );
    seedEntry(
      db,
      { title: "Paddington", genres: ["Family", "Comedy"], overview: "A bear in London." },
      { rating: 8 },
    );
    // realistic corpus so BM25 IDF behaves
    seedEntry(db, { title: "Heat", genres: ["Crime", "Thriller"], overview: "A heist crew and a detective circle each other." }, { rating: 8 });
    seedEntry(db, { title: "Chinatown", genres: ["Crime", "Mystery"], overview: "A private eye uncovers corruption." }, { rating: 7 });
    seedEntry(db, { title: "Whiplash", genres: ["Drama", "Music"], overview: "A young drummer meets a ruthless teacher." }, { rating: 8 });
    seedEntry(db, { title: "Arrival", genres: ["Science Fiction", "Drama"], director: "Denis Villeneuve", overview: "A linguist decodes an alien language." }, { rating: 10 });

    const byNote = retrieveLibrary(db, "something with slow-burn dread");
    expect(byNote[0]?.title).toBe("Dune");

    const byDirector = retrieveLibrary(db, "more villeneuve please");
    expect(byDirector.map((e) => e.title)).toContain("Dune");
    expect(byDirector.map((e) => e.title)).toContain("Arrival");

    const byGenre = retrieveLibrary(db, "cozy family comedy");
    expect(byGenre[0]?.title).toBe("Paddington");
  });
});

describe("RAG layer 1 — taste profile", () => {
  it("aggregates genres, loves, dislikes and directors", () => {
    const db = memoryDb();
    seedEntry(db, { title: "Dune", genres: ["Science Fiction"], director: "Denis Villeneuve" }, { rating: 9, favorite: true });
    seedEntry(db, { title: "Arrival", genres: ["Science Fiction"], director: "Denis Villeneuve" }, { rating: 10 });
    seedEntry(db, { title: "Grown Ups", genres: ["Comedy"] }, { rating: 3 });
    seedEntry(db, { title: "Grown Ups 2", genres: ["Comedy"] }, { rating: 2 });
    seedEntry(db, { title: "Later", genres: ["Drama"] }, { status: "watchlist" });

    const p = computeTasteProfile(db);
    expect(p.librarySize).toBe(5);
    expect(p.topGenres[0].name).toBe("Science Fiction");
    expect(p.avoidedGenres.map((g) => g.name)).toContain("Comedy");
    expect(p.lovedTitles.map((t) => t.title)).toContain("Arrival");
    expect(p.dislikedTitles.map((t) => t.title)).toContain("Grown Ups");
    expect(p.favoriteDirectors[0].name).toBe("Denis Villeneuve");
    expect(p.watchlistSample).toHaveLength(1);

    const text = renderTasteProfile(p);
    expect(text).toContain("Science Fiction");
    expect(text).toContain("Denis Villeneuve");
  });

  it("handles an empty library gracefully", () => {
    const db = memoryDb();
    const p = computeTasteProfile(db);
    expect(p.librarySize).toBe(0);
    expect(renderTasteProfile(p)).toContain("empty");
  });
});

describe("RAG layer 3 — conversation memory", () => {
  it("retrieves snippets from other conversations only", () => {
    const db = memoryDb();
    const c1 = createConversation(db, "Sci-fi night");
    const c2 = createConversation(db, "Current");
    const m1 = persistMessage(db, c1, "user", "I want something like Blade Runner, moody neon noir");
    expect(m1).toBeGreaterThan(0);

    const fromOther = retrieveMemory(db, "blade runner neon noir", c2);
    expect(fromOther).toHaveLength(1);
    expect(fromOther[0].conversationTitle).toBe("Sci-fi night");

    const fromSame = retrieveMemory(db, "blade runner neon noir", c1);
    expect(fromSame).toHaveLength(0);
  });

  it("indexMessage + FTS stay consistent", () => {
    const db = memoryDb();
    const c = createConversation(db);
    const id = persistMessage(db, c, "assistant", "Try Severance — corporate dread.");
    indexMessage(db, id + 999, "orphan row"); // extra manual row is harmless
    const hits = retrieveMemory(db, "severance corporate", c + 1);
    expect(hits.length).toBeGreaterThan(0);
  });
});

describe("RAG context builder", () => {
  it("assembles budgeted context with all layers", () => {
    const db = memoryDb();
    seedEntry(
      db,
      { title: "Dune", genres: ["Science Fiction"] },
      { rating: 9, notes: "x".repeat(5000) },
    );
    const c = createConversation(db);
    const ctx = buildChatContext(db, "epic science fiction dune", c);
    expect(ctx.profileText.length).toBeLessThanOrEqual(2600);
    expect(ctx.libraryText.length).toBeLessThanOrEqual(2400);
    expect(ctx.meta.libraryMatches).toContain("Dune");
    expect(ctx.meta.librarySize).toBe(1);
  });
});

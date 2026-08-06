import { describe, it, expect } from "vitest";
import { getGenreWorld, GENRE_WORLDS } from "../src/services/genreWorld.js";

describe("genreWorld config", () => {
  it("returns a config for a known proof genre", () => {
    const doc = getGenreWorld("documentary");
    expect(doc).toBeDefined();
    expect(doc.register.lexicon).toContain("evidence");
    expect(doc.modules).toContain("timeline");
  });
  it("falls back to a generic world for unknown genres but always enables timeline", () => {
    const g = getGenreWorld("kung-fu");
    expect(g.modules).toContain("timeline");
    expect(g.register).toBeDefined();
  });
  it("proof genres are exactly documentary, sci-fi, horror", () => {
    expect(Object.keys(GENRE_WORLDS).sort()).toEqual(["documentary", "horror", "sci-fi"]);
  });
});

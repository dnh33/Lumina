import { describe, it, expect } from "vitest";
import { GENRE_WORLDS, getGenreWorld } from "./genreWorld.js";

const EXPECTED = [
  "documentary", "science-fiction", "sci-fi", "horror", "romance", "western",
  "anime", "film-noir", "thriller", "fantasy", "crime", "mystery", "comedy",
  "music", "war-politics", "history", "travel",
];

describe("genreWorld v1.5 matrix", () => {
  it("defines a world for every planned genre slug", () => {
    for (const slug of EXPECTED) {
      expect(GENRE_WORLDS[slug], `missing world: ${slug}`).toBeDefined();
    }
  });

  it("every world has >=2 modules (structurally differentiated, not a shell)", () => {
    for (const [slug, w] of Object.entries(GENRE_WORLDS)) {
      expect(w.modules.length, `too few modules for ${slug}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("falls back to Generic for an unknown slug", () => {
    const w = getGenreWorld("kung-fu");
    expect(w.metaphor).toBe("Generic");
    expect(w.modules).toEqual(["timeline"]);
  });
});

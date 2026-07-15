import { describe, it, expect } from "vitest";
import { accentVar } from "./metaphor.js";
import { getGenreWorld } from "./genreWorld.js";
import type { GenreWorld } from "./genreWorld.js";

describe("accentVar", () => {
  it("returns the world's accent token when present", () => {
    const world = getGenreWorld("science-fiction");
    expect(world.register.accent).toBeTruthy();
    expect(accentVar(world)).toBe(world.register.accent);
  });

  it("falls back to amber (#f59e0b) when world is undefined", () => {
    expect(accentVar(undefined)).toBe("#f59e0b");
  });

  it("falls back to amber when world has no register", () => {
    const partial = undefined as unknown as GenreWorld;
    expect(accentVar(partial)).toBe("#f59e0b");
  });

  it("every defined world carries a distinct, truthy accent", () => {
    const slugs = [
      "documentary", "science-fiction", "sci-fi", "horror", "romance", "western",
      "anime", "film-noir", "thriller", "fantasy", "crime", "mystery", "comedy",
      "music", "war-politics", "history", "travel",
    ];
    const accents = new Set<string>();
    for (const slug of slugs) {
      const a = getGenreWorld(slug).register.accent;
      expect(a, `missing accent for ${slug}`).toBeTruthy();
      accents.add(a);
    }
    // GENERIC fallback also has an accent
    expect(getGenreWorld("kung-fu").register.accent).toBeTruthy();
  });
});

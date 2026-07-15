import { describe, it, expect } from "vitest";
import { metaphorLayout } from "./metaphor.js";
import { GENRE_WORLDS, getGenreWorld } from "./genreWorld.js";
import type { MetaphorLayout } from "./metaphor.js";

const ALL_SLUGS = [
  "documentary", "science-fiction", "sci-fi", "horror", "romance", "western",
  "anime", "film-noir", "thriller", "fantasy", "crime", "mystery", "comedy",
  "music", "war-politics", "history", "travel",
];

describe("metaphorLayout (Task 4.1)", () => {
  it("Constellation -> constellation backdrop + constellation card variant", () => {
    const w = getGenreWorld("science-fiction");
    const layout = metaphorLayout(w);
    expect(layout.backdrop).toBe("constellation");
    expect(layout.cardVariant).toBe("constellation");
  });

  it("Frontier -> frontier backdrop + frontier card variant", () => {
    const w = getGenreWorld("western");
    const layout = metaphorLayout(w);
    expect(layout.backdrop).toBe("frontier");
    expect(layout.cardVariant).toBe("frontier");
  });

  it("Generic -> no backdrop + generic card variant", () => {
    const w = getGenreWorld("kung-fu");
    const layout = metaphorLayout(w);
    expect(layout.backdrop).toBe("none");
    expect(layout.cardVariant).toBe("generic");
  });

  it("Threshold / Reading Room / Warm Interior / Panel -> no backdrop + kebab card variant", () => {
    expect(metaphorLayout(getGenreWorld("horror"))).toEqual({
      backdrop: "none",
      cardVariant: "threshold",
    });
    expect(metaphorLayout(getGenreWorld("documentary"))).toEqual({
      backdrop: "none",
      cardVariant: "reading-room",
    });
    expect(metaphorLayout(getGenreWorld("romance"))).toEqual({
      backdrop: "none",
      cardVariant: "warm-interior",
    });
    expect(metaphorLayout(getGenreWorld("anime"))).toEqual({
      backdrop: "none",
      cardVariant: "panel",
    });
  });

  it("is safe on undefined world (falls back to generic / none)", () => {
    const layout = metaphorLayout(undefined);
    expect(layout).toEqual({ backdrop: "none", cardVariant: "generic" });
  });

  it("every defined world resolves to a valid layout (guard loop)", () => {
    const validCardVariants: MetaphorLayout["cardVariant"][] = [
      "constellation", "frontier", "threshold", "reading-room",
      "warm-interior", "panel", "generic",
    ];
    const validBackdrops: MetaphorLayout["backdrop"][] = [
      "constellation", "frontier", "none",
    ];
    for (const slug of ALL_SLUGS) {
      const layout = metaphorLayout(GENRE_WORLDS[slug]);
      expect(validBackdrops, `bad backdrop for ${slug}`).toContain(layout.backdrop);
      expect(validCardVariants, `bad cardVariant for ${slug}`).toContain(layout.cardVariant);
    }
    // GENERATED fallback (non-proof slug) also resolves cleanly
    const fallback = metaphorLayout(getGenreWorld("definitely-not-a-proof-genre"));
    expect(validBackdrops).toContain(fallback.backdrop);
    expect(validCardVariants).toContain(fallback.cardVariant);
  });
});

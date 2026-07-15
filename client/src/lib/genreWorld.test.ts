import { describe, it, expect } from "vitest";
import { GENRE_WORLDS, getGenreWorld, MOOD_TO_SLUGS } from "./genreWorld.js";

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
    // K4: non-proof genres get a real (minimal) world, not a husk.
    // The fallback now ships the server-supported, client-rendered modules
    // instead of a bare ['timeline'].
    expect(w.modules).toEqual(["timeline", "critic", "argument", "maker"]);
  });
});

describe("genreWorld K4: non-proof genres get a real world (not a husk)", () => {
  it("a non-proof slug returns more than one module", () => {
    const w = getGenreWorld("action");
    expect(w.modules.length).toBeGreaterThan(1);
  });

  it("a non-proof slug still carries real, server-supported modules", () => {
    const w = getGenreWorld("action");
    // `critic` (CredibilityStrip) + `argument` + `maker` render real data;
    // they are NOT the bare ['timeline'] husk from before K4.
    expect(w.modules).toContain("critic");
    expect(w.modules).toContain("argument");
    expect(w.modules).toContain("maker");
  });

  it("the fallback keeps an accent (regression guard for 1.8)", () => {
    const w = getGenreWorld("drama");
    expect(w.register.accent).toBeTruthy();
  });

  it("a proof slug still returns its own world unchanged", () => {
    const w = getGenreWorld("documentary");
    expect(w).toBe(GENRE_WORLDS.documentary);
    expect(w.metaphor).toBe("Reading Room");
    expect(w.modules).toEqual([
      "timeline", "maker", "critic", "topic", "argument", "watchorder",
    ]);
  });
});

describe("genreWorld C2: mood entry", () => {
  it("every world declares 2-4 mood words", () => {
    for (const [slug, w] of Object.entries(GENRE_WORLDS)) {
      expect(w.register.moods.length, `mood count for ${slug}`).toBeGreaterThanOrEqual(2);
      expect(w.register.moods.length, `mood count for ${slug}`).toBeLessThanOrEqual(4);
    }
  });

  it("every declared mood is covered by MOOD_TO_SLUGS (no dead chips)", () => {
    const allMoods = new Set(
      Object.values(GENRE_WORLDS).flatMap((w) => w.register.moods),
    );
    for (const mood of allMoods) {
      expect(MOOD_TO_SLUGS[mood], `mood missing from MOOD_TO_SLUGS: ${mood}`).toBeDefined();
      expect(MOOD_TO_SLUGS[mood].length, `mood maps to no slugs: ${mood}`).toBeGreaterThan(0);
    }
  });

  it("every MOOD_TO_SLUGS value points at a real world slug", () => {
    for (const [mood, slugs] of Object.entries(MOOD_TO_SLUGS)) {
      for (const slug of slugs) {
        expect(GENRE_WORLDS[slug], `MOOD_TO_SLUGS['${mood}'] -> unknown slug '${slug}'`).toBeDefined();
      }
    }
  });
});

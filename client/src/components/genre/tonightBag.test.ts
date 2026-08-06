import { describe, it, expect } from "vitest";
import type { GuidedPick } from "../../lib/types.js";
import {
  buildTonightBag,
  libraryWatchlistPath,
} from "./tonightBag.js";

const picks: GuidedPick[] = [
  {
    tmdbId: 10,
    mediaType: "movie",
    title: "Already Home",
    year: 1999,
    posterPath: "/a.jpg",
    voteAverage: 8,
    inLibrary: true,
  },
  {
    tmdbId: 20,
    mediaType: "movie",
    title: "Bagged Tonight",
    year: 2020,
    posterPath: "/b.jpg",
    voteAverage: 7,
    inLibrary: true,
  },
  {
    tmdbId: 30,
    mediaType: "tv",
    title: "Still On Shelf",
    year: 2015,
    posterPath: null,
    voteAverage: 6,
    inLibrary: false,
  },
];

describe("libraryWatchlistPath", () => {
  it('returns "/library?status=watchlist"', () => {
    expect(libraryWatchlistPath()).toBe("/library?status=watchlist");
  });
});

describe("buildTonightBag", () => {
  it("returns empty when nothing was watchlisted this session", () => {
    expect(buildTonightBag(picks, [])).toEqual([]);
  });

  it("includes only picks watchlisted this session (acted ids), not pre-library peers", () => {
    const bag = buildTonightBag(picks, [20]);
    expect(bag).toEqual([
      {
        tmdbId: 20,
        mediaType: "movie",
        title: "Bagged Tonight",
        posterPath: "/b.jpg",
      },
    ]);
  });

  it("preserves shelf pick order for multiple bagged titles", () => {
    const bag = buildTonightBag(picks, [30, 20]);
    expect(bag.map((i) => i.tmdbId)).toEqual([20, 30]);
  });

  it("omits posterPath when pick has null poster", () => {
    const bag = buildTonightBag(picks, [30]);
    expect(bag).toEqual([
      {
        tmdbId: 30,
        mediaType: "tv",
        title: "Still On Shelf",
      },
    ]);
  });
});

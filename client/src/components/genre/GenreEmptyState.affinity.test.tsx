import { describe, it, expect } from "vitest";
import { affinityScore, uniquePicks } from "./GenreEmptyState.js";
import type { CatalogItem } from "../../lib/types.js";

function item(partial: Partial<CatalogItem> & Pick<CatalogItem, "tmdbId" | "title">): CatalogItem {
  return {
    mediaType: "movie",
    year: 1994,
    overview: "",
    posterPath: "/p.jpg",
    backdropPath: null,
    voteAverage: 7,
    genreIds: [],
    popularity: 10,
    inLibrary: false,
    ...partial,
  };
}

describe("GenreEmptyState film-noir affinity", () => {
  const prestige = [
    item({ tmdbId: 278, title: "The Shawshank Redemption", voteAverage: 8.7, genreIds: [18, 80] }),
    item({ tmdbId: 238, title: "The Godfather", voteAverage: 8.7, genreIds: [18, 80] }),
    item({ tmdbId: 155, title: "The Dark Knight", voteAverage: 8.5, genreIds: [28, 80, 18] }),
    item({ tmdbId: 497, title: "The Green Mile", voteAverage: 8.5, genreIds: [14, 18, 80] }),
  ];

  const noirAdjacent = [
    item({
      tmdbId: 274,
      title: "Chinatown",
      year: 1974,
      voteAverage: 7.9,
      genreIds: [80, 9648, 53],
      overview: "A private eye uncovers a web of corruption.",
    }),
    item({
      tmdbId: 289,
      title: "Casablanca",
      year: 1942,
      voteAverage: 8.2,
      genreIds: [18, 10749],
      overview: "A wartime romance in Morocco.",
    }),
    item({
      tmdbId: 901,
      title: "Blade Runner",
      year: 1982,
      voteAverage: 7.9,
      genreIds: [878, 53],
      overview: "A neo-noir detective hunts replicants.",
    }),
  ];

  it("scores keyword noir above prestige crime dramas", () => {
    const chinatown = noirAdjacent[0]!;
    const shawshank = prestige[0]!;
    expect(affinityScore("film-noir", chinatown)).toBeGreaterThan(
      affinityScore("film-noir", shawshank),
    );
  });

  it("excludes prestige pollution from film-noir picks", () => {
    const picks = uniquePicks([...prestige, ...noirAdjacent], "film noir", 5, new Set(), {
      slug: "film-noir",
      mediaType: "movie",
    });
    const titles = picks.map((p) => p.title);
    expect(titles).toContain("Chinatown");
    expect(titles).toContain("Blade Runner");
    expect(titles).not.toContain("The Shawshank Redemption");
    expect(titles).not.toContain("The Godfather");
    expect(titles).not.toContain("The Dark Knight");
    expect(titles).not.toContain("The Green Mile");
    expect(titles).not.toContain("Casablanca");
  });

  it("respects mediaType so movie prestige cannot leak onto TV", () => {
    const tvNoir = item({
      tmdbId: 46648,
      title: "True Detective",
      mediaType: "tv",
      year: 2014,
      voteAverage: 8.2,
      genreIds: [80, 18, 9648],
      overview: "Detectives dig into a murder with fatal motives.",
    });
    const picks = uniquePicks([...prestige, tvNoir], "film noir", 5, new Set(), {
      slug: "film-noir",
      mediaType: "tv",
    });
    expect(picks).toHaveLength(1);
    expect(picks[0]!.title).toBe("True Detective");
    expect(picks[0]!.mediaType).toBe("tv");
  });

  it("does not fall back to voteAverage-only prestige for film-noir", () => {
    const picks = uniquePicks(prestige, "film noir", 5, new Set(), {
      slug: "film-noir",
      mediaType: "movie",
    });
    expect(picks).toHaveLength(0);
  });
});

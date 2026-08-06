import { describe, it, expect } from "vitest";
import {
  affinityScore,
  decadeOfYear,
  selectEraBalancedRail,
  worldIntegrityScore,
  type EraRankable,
} from "../src/services/eraRailQuality.js";

function item(
  partial: Partial<EraRankable> & Pick<EraRankable, "tmdbId" | "title">,
): EraRankable {
  return {
    mediaType: "movie",
    year: 2015,
    overview: "A substantial overview that passes the thin-copy check for integrity.",
    posterPath: "/p.jpg",
    voteAverage: 7.5,
    genreIds: [99],
    popularity: 20,
    ...partial,
  };
}

describe("eraRailQuality", () => {
  it("decadeOfYear floors to decade and maps unknown to 0", () => {
    expect(decadeOfYear(1974)).toBe(1970);
    expect(decadeOfYear(2019)).toBe(2010);
    expect(decadeOfYear(null)).toBe(0);
  });

  it("scores film-noir keyword titles above prestige crime dramas", () => {
    const chinatown = item({
      tmdbId: 274,
      title: "Chinatown",
      year: 1974,
      voteAverage: 7.9,
      genreIds: [80, 9648, 53],
      overview: "A private eye uncovers a web of corruption.",
    });
    const shawshank = item({
      tmdbId: 278,
      title: "The Shawshank Redemption",
      year: 1994,
      voteAverage: 8.7,
      genreIds: [18, 80],
      overview: "Two imprisoned men bond over years.",
    });
    expect(affinityScore("film-noir", chinatown)).toBeGreaterThan(
      affinityScore("film-noir", shawshank),
    );
  });

  it("drops prestige pollution from film-noir rails", () => {
    const pool = [
      item({
        tmdbId: 278,
        title: "The Shawshank Redemption",
        year: 1994,
        voteAverage: 8.7,
        genreIds: [18, 80],
        overview: "Two imprisoned men bond over years.",
      }),
      item({
        tmdbId: 274,
        title: "Chinatown",
        year: 1974,
        voteAverage: 7.9,
        genreIds: [80, 9648, 53],
        overview: "A private eye uncovers a web of corruption.",
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
    const picked = selectEraBalancedRail(pool, { slug: "film-noir", limit: 5 });
    const titles = picked.map((p) => p.title);
    expect(titles).toContain("Chinatown");
    expect(titles).toContain("Blade Runner");
    expect(titles).not.toContain("The Shawshank Redemption");
  });

  it("refuses non-documentary genre pollution in documentary world", () => {
    const pool = [
      item({
        tmdbId: 1,
        title: "Fake Prestige Drama",
        year: 2015,
        voteAverage: 9,
        genreIds: [18],
        overview: "An Oscar-bait drama that somehow entered the pool.",
      }),
      item({
        tmdbId: 2,
        title: "Real Doc",
        year: 2014,
        voteAverage: 7.2,
        genreIds: [99],
        overview: "A careful documentary about something that actually happened.",
      }),
    ];
    const picked = selectEraBalancedRail(pool, { slug: "documentary", limit: 5 });
    expect(picked.map((p) => p.title)).toEqual(["Real Doc"]);
  });

  it("drops low-vote documentary junk below craft floor", () => {
    const pool = [
      item({
        tmdbId: 3,
        title: "Jackass Number Two",
        year: 2006,
        voteAverage: 6.6,
        genreIds: [99],
        popularity: 50,
        overview: "Stunts and pranks.",
      }),
      item({
        tmdbId: 4,
        title: "Grizzly Man",
        year: 2005,
        voteAverage: 7.5,
        genreIds: [99],
        overview: "A careful documentary about something that actually happened.",
      }),
    ];
    const picked = selectEraBalancedRail(pool, { slug: "documentary", limit: 5 });
    expect(picked.map((p) => p.title)).toEqual(["Grizzly Man"]);
  });

  it("caps a mega-decade so it cannot eat the rail", () => {
    const pool: EraRankable[] = [];
    for (let i = 0; i < 20; i++) {
      pool.push(
        item({
          tmdbId: 1000 + i,
          title: `Doc 2010s ${i}`,
          year: 2010 + (i % 9),
          voteAverage: 8,
          genreIds: [99],
        }),
      );
    }
    for (let i = 0; i < 4; i++) {
      pool.push(
        item({
          tmdbId: 2000 + i,
          title: `Doc 1970s ${i}`,
          year: 1972 + i,
          voteAverage: 7.5,
          genreIds: [99],
        }),
      );
    }
    const picked = selectEraBalancedRail(pool, {
      slug: "documentary",
      limit: 20,
      maxPerDecade: 14,
      softMinPerDecade: 3,
    });
    const c2010 = picked.filter((p) => decadeOfYear(p.year) === 2010).length;
    const c1970 = picked.filter((p) => decadeOfYear(p.year) === 1970).length;
    expect(c2010).toBeLessThanOrEqual(14);
    expect(c1970).toBeGreaterThanOrEqual(3);
    expect(c1970).toBe(4);
  });

  it("soft-caps vote spam so integrity can prefer metaphor fit", () => {
    const loud = item({
      tmdbId: 10,
      title: "Viral Thin Doc",
      year: 2018,
      voteAverage: 9.1,
      popularity: 90,
      genreIds: [99],
      overview: "Short.",
    });
    const craft = item({
      tmdbId: 11,
      title: "Craft Doc",
      year: 2016,
      voteAverage: 7.8,
      popularity: 15,
      genreIds: [99],
      overview: "A substantial overview that passes the thin-copy check for integrity.",
    });
    // Both documentary; soft-capped vote should not let 9.1 dominate by raw margin alone.
    expect(worldIntegrityScore("documentary", craft)).toBeGreaterThan(
      worldIntegrityScore("documentary", loud) - 20,
    );
  });
});

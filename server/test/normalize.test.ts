import { describe, expect, it } from "vitest";
import {
  normalizeDetails,
  normalizeItem,
  normalizeSeason,
} from "../src/tmdb/normalize.js";
import { parseCsvLine } from "../src/services/exportService.js";

describe("TMDB normalizers", () => {
  it("normalizes a raw movie list item", () => {
    const item = normalizeItem({
      id: 693134,
      media_type: "movie",
      title: "Dune: Part Two",
      release_date: "2024-02-27",
      overview: "Paul unites with the Fremen.",
      poster_path: "/p.jpg",
      backdrop_path: "/b.jpg",
      vote_average: 8.163,
      genre_ids: [878, 12],
    })!;
    expect(item.mediaType).toBe("movie");
    expect(item.year).toBe(2024);
    expect(item.voteAverage).toBe(8.2);
  });

  it("normalizes a tv item via name/first_air_date", () => {
    const item = normalizeItem(
      { id: 1, name: "Succession", first_air_date: "2018-06-03" },
      "tv",
    )!;
    expect(item.mediaType).toBe("tv");
    expect(item.title).toBe("Succession");
    expect(item.year).toBe(2018);
  });

  it("rejects unknown media types (people etc.)", () => {
    expect(normalizeItem({ id: 5, media_type: "person" })).toBeNull();
  });

  it("normalizes full movie details with director and similar", () => {
    const d = normalizeDetails(
      {
        id: 27205,
        title: "Inception",
        release_date: "2010-07-15",
        runtime: 148,
        tagline: "Your mind is the scene of the crime.",
        genres: [{ id: 878, name: "Science Fiction" }],
        credits: {
          cast: [{ name: "Leonardo DiCaprio", character: "Cobb", profile_path: "/l.jpg" }],
          crew: [{ name: "Christopher Nolan", job: "Director" }],
        },
        similar: { results: [{ id: 155, media_type: "movie", title: "The Dark Knight", poster_path: "/d.jpg", release_date: "2008-07-16" }] },
      },
      "movie",
    );
    expect(d.director).toBe("Christopher Nolan");
    expect(d.cast[0].name).toBe("Leonardo DiCaprio");
    expect(d.similar[0].title).toBe("The Dark Knight");
    expect(d.runtime).toBe(148);
  });

  it("normalizes tv details with creator and seasons, skipping specials", () => {
    const d = normalizeDetails(
      {
        id: 1399,
        name: "Game of Thrones",
        first_air_date: "2011-04-17",
        episode_run_time: [55],
        number_of_seasons: 8,
        number_of_episodes: 73,
        created_by: [{ name: "David Benioff" }],
        seasons: [
          { season_number: 0, name: "Specials", episode_count: 10 },
          { season_number: 1, name: "Season 1", episode_count: 10, air_date: "2011-04-17" },
        ],
      },
      "tv",
    );
    expect(d.director).toBe("David Benioff");
    expect(d.seasons).toHaveLength(1);
    expect(d.seasons[0].seasonNumber).toBe(1);
    expect(d.runtime).toBe(55);
  });

  it("normalizes season episodes", () => {
    const eps = normalizeSeason({
      episodes: [
        { season_number: 1, episode_number: 1, name: "Pilot", air_date: "2011-04-17", runtime: 62 },
      ],
    });
    expect(eps[0]).toMatchObject({ season: 1, episode: 1, name: "Pilot" });
  });
});

describe("CSV parsing", () => {
  it("handles quoted fields with commas and escaped quotes", () => {
    expect(parseCsvLine('"Dune, Part Two",2024,movie,9,watched,"epic ""sand"" opera"')).toEqual([
      "Dune, Part Two",
      "2024",
      "movie",
      "9",
      "watched",
      'epic "sand" opera',
    ]);
  });
});

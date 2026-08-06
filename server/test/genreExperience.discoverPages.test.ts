import { describe, it, expect, vi, beforeEach } from "vitest";

const tmdbGet = vi.fn();

vi.mock("../src/tmdb/client.js", () => ({
  tmdbGet: (...args: unknown[]) => tmdbGet(...args),
  genreMap: vi.fn(),
}));

import { fetchDiscoverPages } from "../src/services/genreExperienceService.js";

function pageResults(ids: number[]) {
  return ids.map((id) => ({
    id,
    title: `Title ${id}`,
    poster_path: `/p${id}.jpg`,
    overview: "",
    genre_ids: [99],
    vote_average: 7,
    popularity: 10,
    release_date: "2015-01-01",
  }));
}

describe("fetchDiscoverPages", () => {
  beforeEach(() => {
    tmdbGet.mockReset();
  });

  it("requests pages 1..5 and concatenates results", async () => {
    tmdbGet
      .mockResolvedValueOnce({ results: pageResults([1, 2]), page: 1, total_pages: 8 })
      .mockResolvedValueOnce({ results: pageResults([3, 4]), page: 2, total_pages: 8 })
      .mockResolvedValueOnce({ results: pageResults([5, 6]), page: 3, total_pages: 8 })
      .mockResolvedValueOnce({ results: pageResults([7, 8]), page: 4, total_pages: 8 })
      .mockResolvedValueOnce({ results: pageResults([9, 10]), page: 5, total_pages: 8 });

    const raw = await fetchDiscoverPages("/discover/movie", {
      with_genres: "99",
      sort_by: "popularity.desc",
      "vote_count.gte": 250,
      include_adult: "false",
    });

    expect(tmdbGet).toHaveBeenCalledTimes(5);
    expect(tmdbGet.mock.calls.map((c) => c[1].page)).toEqual([1, 2, 3, 4, 5]);
    expect(raw.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("dedupes by id keeping first occurrence", async () => {
    tmdbGet
      .mockResolvedValueOnce({ results: pageResults([1, 2]), page: 1, total_pages: 5 })
      .mockResolvedValueOnce({ results: pageResults([2, 3]), page: 2, total_pages: 5 })
      .mockResolvedValueOnce({ results: pageResults([3, 4]), page: 3, total_pages: 5 })
      .mockResolvedValueOnce({ results: pageResults([4, 5]), page: 4, total_pages: 5 })
      .mockResolvedValueOnce({ results: pageResults([5, 6]), page: 5, total_pages: 5 });

    const raw = await fetchDiscoverPages("/discover/movie", { with_genres: "99" });
    expect(raw.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("stops early when total_pages is smaller than requested", async () => {
    tmdbGet.mockResolvedValueOnce({
      results: pageResults([10]),
      page: 1,
      total_pages: 1,
    });

    const raw = await fetchDiscoverPages("/discover/tv", { with_genres: "99" }, 5);
    expect(tmdbGet).toHaveBeenCalledTimes(1);
    expect(raw.map((r) => r.id)).toEqual([10]);
  });
});

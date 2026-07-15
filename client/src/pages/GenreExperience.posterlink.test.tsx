import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "Step into the evidence.", tone: "hushed, forensic", basedOn: ["The Act of Killing"] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
    { tmdbId: 2, mediaType: "movie", title: "Doc Two", year: 2018, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.4, genreIds: [99], popularity: 9, inLibrary: false },
    { tmdbId: 3, mediaType: "movie", title: "Doc Three", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.9, genreIds: [99], popularity: 8, inLibrary: false },
    { tmdbId: 4, mediaType: "movie", title: "Doc Four", year: 2009, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.6, genreIds: [99], popularity: 7, inLibrary: false },
    { tmdbId: 5, mediaType: "movie", title: "Doc Five", year: 2020, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.3, genreIds: [99], popularity: 11, inLibrary: false },
    { tmdbId: 6, mediaType: "movie", title: "Doc Six", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.8, genreIds: [99], popularity: 6, inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "rich",
};

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => experience),
    genreIntro: vi.fn(async () => experience.intro),
  },
}));

function renderAt(slug: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/genre/${slug}`]}>
        <Routes>
          <Route path="/genre/:slug" element={<GenreExperience />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience rail posters link to /title (K2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a rail of PosterCards whose posters link to the title page", async () => {
    renderAt("documentary");

    // With decade=null the page shows ALL items, so "Doc One" appears in both
    // the carousel rail AND the TimelineScrubber's decade list. Scope to the
    // "For You in this World" carousel section first, then assert the poster
    // links live inside it. We wait on the link itself rather than the (now
    // ambiguous) title text.
    const heading = await screen.findByRole("heading", { name: /for you in this world/i });
    const carousel = heading.closest("section")!;
    await waitFor(() => {
      expect(carousel.querySelector(`a[href="/title/movie/1"]`)).not.toBeNull();
    });
    const docTwoLink = carousel.querySelector(`a[href="/title/movie/2"]`);
    expect(docTwoLink).not.toBeNull();
  });
});

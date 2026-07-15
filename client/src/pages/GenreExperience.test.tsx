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
  anchorsUsed: [{ tmdbId: 50, mediaType: "movie", title: "The Act of Killing", rating: 9 }],
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

describe("GenreExperience page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the genre name and world tone as hero copy", async () => {
    renderAt("documentary");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toBeDefined());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/documentary/i);
    // hero shows the world's tonePrompt (from genreWorld config), not intro.tone
    expect(screen.getByText(/curious, credible, analytical/i)).toBeDefined();
  });

  it("renders a rail of items via PosterCard (posterPath shape consumed)", async () => {
    renderAt("documentary");
    await waitFor(() => expect(screen.getAllByText("Doc One").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Doc Two").length).toBeGreaterThan(0);
  });

  it("shows the library-anchor framing from anchorsUsed", async () => {
    renderAt("documentary");
    await waitFor(() => expect(screen.getAllByText(/The Act of Killing/i).length).toBeGreaterThan(0));
  });
});

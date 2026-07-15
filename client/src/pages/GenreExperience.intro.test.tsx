import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

// Items query: NO intro (intro is now split into its own query).
const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  // intro intentionally absent after the split
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

// Intro query: the curated hook now lives here.
const intro = {
  hook: "Step into the evidence.",
  tone: "hushed, forensic",
  basedOn: ["The Act of Killing"],
};

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => experience),
    genreIntro: vi.fn(async () => intro),
  },
}));

async function renderIntro() {
  const qc = new QueryClient();
  const mod = await import("./GenreExperience.js");
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/genre/documentary"]}>
        <Routes>
          <Route path="/genre/:slug" element={<mod.default />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience openGuided reads from the split intro query (P1.3)", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("navigates to /chat with a prefill sourced from the intro query", async () => {
    await renderIntro();
    await waitFor(() =>
      expect(screen.getByText(/Explore with the Companion/i)).toBeDefined(),
    );
    fireEvent.click(screen.getByText(/Explore with the Companion/i));
    expect(navigate).toHaveBeenCalledWith(
      "/chat",
      expect.objectContaining({
        state: expect.objectContaining({
          prefill: expect.stringContaining("Step into the evidence."),
        }),
      }),
    );
  });
});

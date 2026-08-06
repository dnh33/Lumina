import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "Step into the evidence.", tone: "hushed, forensic", basedOn: [] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
    { tmdbId: 2, mediaType: "movie", title: "Doc Two", year: 2016, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.4, genreIds: [99], popularity: 9, inLibrary: false },
    { tmdbId: 3, mediaType: "movie", title: "Doc Three", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.9, genreIds: [99], popularity: 8, inLibrary: false },
    { tmdbId: 4, mediaType: "movie", title: "Doc Four", year: 2018, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.6, genreIds: [99], popularity: 7, inLibrary: false },
    { tmdbId: 5, mediaType: "movie", title: "Doc Five", year: 2019, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.3, genreIds: [99], popularity: 11, inLibrary: false },
    { tmdbId: 6, mediaType: "movie", title: "Doc Six", year: 2020, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.8, genreIds: [99], popularity: 6, inLibrary: false },
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

function renderAt(entry = "/genre/documentary") {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/genre/:slug" element={<GenreExperience />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience accessibility (C3)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("exposes a main landmark id=world-main and a skip link that focuses it", async () => {
    const { container } = renderAt();
    // Skip link is rendered once the page has painted (inside <main id=world-main>).
    const skip = await screen.findByRole("link", { name: /skip to world/i });
    expect(skip.getAttribute("href")).toBe("#world-main");

    const main = container.ownerDocument.getElementById("world-main") as HTMLElement;
    expect(main).toBeTruthy();
    expect(main.tagName).toBe("MAIN");

    fireEvent.click(skip);
    await waitFor(() => expect(document.activeElement).toBe(main));
  });

  it("renders an error state with a Retry button carrying the retry aria-label", async () => {
    const { api } = await import("../lib/api.js");
    (api.genreExperience as any).mockImplementation(async () => {
      throw new Error("boom");
    });
    (api.genreIntro as any).mockImplementation(async () => {
      throw new Error("boom");
    });

    renderAt();
    await waitFor(() =>
      expect(screen.getByText(/couldn.t open this world/i)).toBeDefined(),
    );
    const retry = screen.getByRole("button", {
      name: /retry loading this world/i,
    });
    expect(retry).toBeDefined();

    // clicking retry re-runs the server query
    fireEvent.click(retry);
    await waitFor(() =>
      expect((api.genreExperience as any).mock.calls.length).toBeGreaterThan(1),
    );
  });
});

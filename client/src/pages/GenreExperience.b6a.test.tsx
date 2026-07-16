import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

// 8 items spanning three decades so a decade pick is meaningful.
const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "Step into the evidence.", tone: "hushed, forensic", basedOn: [] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc 1994", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
    { tmdbId: 2, mediaType: "movie", title: "Doc 1998", year: 1998, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.4, genreIds: [99], popularity: 9, inLibrary: false },
    { tmdbId: 3, mediaType: "movie", title: "Doc 2003", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.9, genreIds: [99], popularity: 8, inLibrary: false },
    { tmdbId: 4, mediaType: "movie", title: "Doc 2007", year: 2007, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.6, genreIds: [99], popularity: 7, inLibrary: false },
    { tmdbId: 5, mediaType: "movie", title: "Doc 2012", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.3, genreIds: [99], popularity: 11, inLibrary: false },
    { tmdbId: 6, mediaType: "movie", title: "Doc 2017", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.8, genreIds: [99], popularity: 6, inLibrary: false },
    { tmdbId: 7, mediaType: "movie", title: "Doc 2019", year: 2019, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.0, genreIds: [99], popularity: 5, inLibrary: false },
    { tmdbId: 8, mediaType: "movie", title: "Doc 2021", year: 2021, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 4, inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "rich",
};

// Mutable insight implementation — swapped per test.
const insightImpl = vi.fn(async () => ({ hook: "x" }));
vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => experience),
    genreIntro: vi.fn(async () => experience.intro),
    insight: (...args: any[]) => insightImpl(...args),
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

const DETERMINISTIC = /Era thesis for the 1990s:/;

describe("GenreExperience B6a decade real zoom + LLM era-thesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    insightImpl.mockImplementation(async () => ({ hook: "x" }));
  });

  it("applies a layout-affecting zoom class when a decade is selected", async () => {
    const { container } = renderAt("documentary");

    const main = await waitFor(() => {
      const el = container.querySelector("#world-main");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    expect(main.classList.contains("zoomed-decade")).toBe(false);

    fireEvent.click(await screen.findByRole("tab", { name: "1990s" }));

    await waitFor(() => expect(main.classList.contains("zoomed-decade")).toBe(true));
  });

  it("swaps the deterministic thesis for the LLM thesis when insight resolves", async () => {
    insightImpl.mockImplementation(async () => ({ hook: "LLM ERA THESIS" }));
    renderAt("documentary");

    fireEvent.click(await screen.findByRole("tab", { name: "1990s" }));

    // deterministic fallback paints first
    await waitFor(() => expect(screen.getByText(DETERMINISTIC)).toBeTruthy());

    // LLM thesis replaces it (assert on the era-thesis node specifically)
    await waitFor(() =>
      expect(screen.getByTestId("era-thesis")).toHaveTextContent("LLM ERA THESIS"),
    );
    expect(screen.queryByText(DETERMINISTIC)).toBeNull();
  });

  it("keeps the deterministic thesis when the LLM call fails", async () => {
    insightImpl.mockImplementation(async () => {
      throw new Error("llm down");
    });
    renderAt("documentary");

    fireEvent.click(await screen.findByRole("tab", { name: "1990s" }));

    // deterministic fallback stands; LLM never arrives
    await waitFor(() => expect(screen.getByText(DETERMINISTIC)).toBeTruthy());
    expect(screen.queryByText("LLM ERA THESIS")).toBeNull();
  });
});

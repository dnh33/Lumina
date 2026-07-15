import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// P2.2: the `argument` module must paint the rails immediately (from
// details/ratings) and only THEN fetch `argument` per-title via api.insight,
// streaming ArgumentPanels in after paint. This test mocks api.insight and
// asserts it is called per item's tmdbId AND that the thesis renders.

const items = [
  { tmdbId: 1, mediaType: "movie", title: "Doc One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 2, mediaType: "movie", title: "Doc Two", year: 2018, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.4, genreIds: [99], popularity: 9, inLibrary: false },
  { tmdbId: 3, mediaType: "movie", title: "Doc Three", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.9, genreIds: [99], popularity: 8, inLibrary: false },
  { tmdbId: 4, mediaType: "movie", title: "Doc Four", year: 2009, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.6, genreIds: [99], popularity: 7, inLibrary: false },
  { tmdbId: 5, mediaType: "movie", title: "Doc Five", year: 2020, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.3, genreIds: [99], popularity: 11, inLibrary: false },
  { tmdbId: 6, mediaType: "movie", title: "Doc Six", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.8, genreIds: [99], popularity: 6, inLibrary: false },
];

const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  items,
  anchorsUsed: [],
  profileState: "rich",
};

const insight = vi.fn(async (type: string, tmdbId: number) => ({
  hook: `thesis-${tmdbId}`,
  text: `prose-${tmdbId}`,
  comparisons:
    type === "movie" && tmdbId === 1
      ? [{ tmdbId: 999, mediaType: "movie", title: "Y", relation: "echoes", year: 2020, note: "" }]
      : [],
}));

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => experience),
    genreIntro: vi.fn(async () => null),
    insight,
  },
}));

async function renderLazy() {
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

describe("GenreExperience lazy argument enrichment (P2.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insight.mockImplementation(async (type: string, tmdbId: number) => ({
      hook: `thesis-${tmdbId}`,
      text: `prose-${tmdbId}`,
      comparisons:
        type === "movie" && tmdbId === 1
          ? [{ tmdbId: 999, mediaType: "movie", title: "Y", relation: "echoes", year: 2020, note: "" }]
          : [],
    }));
  });

  it("renders the rails immediately (no insight call blocking paint)", async () => {
    await renderLazy();
    // Rails paint from the items payload without waiting on insight.
    await waitFor(() => expect(screen.getAllByText("Doc One").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Doc Two").length).toBeGreaterThan(0);
  });

  it("fetches argument per-title after paint and streams ArgumentPanels in", async () => {
    await renderLazy();
    // Rails must paint first.
    await waitFor(() => expect(screen.getAllByText("Doc One").length).toBeGreaterThan(0));

    // After data loads, api.insight fires for each item's tmdbId (caretaker
    // effects may re-run, so assert >= per-item, not exactly once).
    await waitFor(() => expect(insight.mock.calls.length).toBeGreaterThanOrEqual(items.length));
    items.forEach((it) => {
      expect(insight).toHaveBeenCalledWith(it.mediaType, it.tmdbId);
    });

    // The ArgumentPanels stream in with the fetched thesis.
    await waitFor(() => expect(screen.getAllByText(/thesis-1/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/thesis-2/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/thesis-3/).length).toBeGreaterThan(0);

    // The first item's counterpoint (from insight.comparisons[0]) renders with
    // its linked title + relation. ArgumentPanel formats it as a link/label.
    await waitFor(() => expect(screen.getAllByText(/Y/).length).toBeGreaterThan(0));
  });

  it("gracefully skips a title when api.insight rejects (LLM down)", async () => {
    insight.mockRejectedValueOnce(new Error("LLM down"));
    await renderLazy();
    await waitFor(() => expect(screen.getAllByText("Doc One").length).toBeGreaterThan(0));

    // Other items still resolve their arguments after paint.
    await waitFor(() => expect(insight).toHaveBeenCalledTimes(items.length));
    await waitFor(() => expect(screen.getAllByText(/thesis-2/).length).toBeGreaterThan(0));
    // The failed title simply never streamed in its panel — no crash.
    expect(screen.queryByText(/thesis-1/)).toBeNull();
  });
});

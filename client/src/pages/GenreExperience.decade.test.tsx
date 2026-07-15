import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

// 8 items spanning three decades so a decade filter visibly shrinks the rail.
const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "Step into the evidence.", tone: "hushed, forensic", basedOn: ["The Act of Killing"] },
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

/** The main "For You in this World" rail is the only Carousel whose heading
 *  is "For You in this World". TopicCluster renders its own PosterCards, so we
 *  scope the link count to this carousel to isolate the decade-filtered rail. */
function railLinks(container: HTMLElement) {
  const heading = screen.getByRole("heading", { name: /for you in this world/i });
  const carousel = heading.closest("section")!;
  return within(carousel).queryAllByRole("link");
}

describe("GenreExperience decade page-scope filter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows all items by default, then filters the whole rail when a decade is picked", async () => {
    const { container } = renderAt("documentary");
    await waitFor(() => expect(railLinks(container).length).toBe(8));

    // pick the 1990s tab in the TimelineScrubber
    fireEvent.click(screen.getByRole("tab", { name: "1990s" }));

    await waitFor(() => expect(railLinks(container).length).toBe(2)); // Doc 1994 + Doc 1998
    const hrefs = railLinks(container).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/title/movie/1");
    expect(hrefs).toContain("/title/movie/2");
    expect(hrefs).not.toContain("/title/movie/5");
  });

  it("steps to the next decade via the scrubber arrow and re-filters the rail", async () => {
    const { container } = renderAt("documentary");
    await waitFor(() => expect(railLinks(container).length).toBe(8));

    fireEvent.click(screen.getByRole("button", { name: /next decade/i }));

    await waitFor(() => expect(railLinks(container).length).toBe(2)); // 2000s
    const hrefs = railLinks(container).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/title/movie/3");
    expect(hrefs).not.toContain("/title/movie/1");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
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

import { api } from "../lib/api.js";

// Probe that shares the router context with the page so we can read the live
// `?mediaType=` URL param after the page mutates it via setSearchParams.
function MediaParamProbe() {
  const [params] = useSearchParams();
  return (
    <div data-testid="media-param">{params.get("mediaType") ?? "none"}</div>
  );
}

function renderAt(entry: string) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/genre/:slug" element={<><GenreExperience /><MediaParamProbe /></>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience TV (K1) deep-linkable media type", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("defaults to movie and omits the param when none is present", async () => {
    renderAt("/genre/documentary");
    await waitFor(() =>
      expect(api.genreExperience).toHaveBeenCalledWith(
        ["documentary"], "self", "movie", expect.any(Array),
      ),
    );
    expect(screen.getByTestId("media-param").textContent).toBe("none");
  });

  it("honors a deep-linked ?mediaType=tv and queries the server with 'tv'", async () => {
    renderAt("/genre/documentary?mediaType=tv");
    await waitFor(() =>
      expect(api.genreExperience).toHaveBeenCalledWith(
        ["documentary"], "self", "tv", expect.any(Array),
      ),
    );
    expect(screen.getByTestId("media-param").textContent).toBe("tv");
    const mediaGroup = await screen.findByRole("group", { name: /media type/i });
    expect(within(mediaGroup).getByRole("button", { name: "TV" })).toHaveAttribute("aria-pressed", "true");
  });

  it("toggling TV writes ?mediaType=tv; toggling back to Movies clears it", async () => {
    renderAt("/genre/documentary");
    const mediaGroup = await screen.findByRole("group", { name: /media type/i });
    await waitFor(() =>
      expect(within(mediaGroup).getByRole("button", { name: "TV" })).toBeDefined(),
    );

    fireEvent.click(within(mediaGroup).getByRole("button", { name: "TV" }));
    await waitFor(() => {
      expect(screen.getByTestId("media-param").textContent).toBe("tv");
      const calls = (api.genreExperience as any).mock.calls;
      const last = calls[calls.length - 1];
      expect(last).toEqual([["documentary"], "self", "tv", expect.any(Array)]);
    });

    // the Movies side of the same toggle group carries the "Movies" name.
    // Re-query the group — the TV click above re-rendered the tree, so the
    // earlier `mediaGroup` reference is detached.
    const mediaGroup2 = await screen.findByRole("group", { name: /media type/i });
    fireEvent.click(within(mediaGroup2).getByRole("button", { name: "Movies" }));
    await waitFor(() => {
      expect(screen.getByTestId("media-param").textContent).toBe("none");
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- fixtures --------------------------------------------------------------

function makeItem(tmdbId: number, title: string, over: Partial<any> = {}) {
  return {
    tmdbId,
    mediaType: "movie" as const,
    title,
    year: 2000,
    overview: "",
    posterPath: null,
    backdropPath: null,
    voteAverage: 5,
    genreIds: [18],
    popularity: null,
    ...over,
  };
}

const EXPERIENCE = {
  key: "documentary",
  genres: ["documentary"],
  mode: "self",
  intro: null,
  items: [
    makeItem(1, "Alpha Film", { year: 1995, voteAverage: 7.2, genreIds: [99, 18] }),
    makeItem(2, "Beta Doc", { year: 2021, voteAverage: 8.1, genreIds: [99] }),
    makeItem(3, "Gamma Story", { year: 2003, voteAverage: 6.0, genreIds: [18] }),
    makeItem(4, "Delta Tale", { year: 2010, voteAverage: 6.5, genreIds: [99] }),
    makeItem(5, "Epsilon Yarn", { year: 2007, voteAverage: 5.4, genreIds: [18] }),
    makeItem(6, "Zeta Reel", { year: 1998, voteAverage: 7.0, genreIds: [99, 18] }),
    makeItem(7, "Theta Cut", { year: 2015, voteAverage: 6.8, genreIds: [99] }),
  ],
  anchorsUsed: [],
  profileState: {},
};

const INTRO = { hook: "Dive in.", tone: "warm", basedOn: [] };

// --- mocks -----------------------------------------------------------------

// Mock the api module with resolvable fns so the queries paint. The component
// is imported dynamically (after hoisted mocks register) — mirrors the working
// GenreExperience.intro.test.tsx pattern.
vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => EXPERIENCE),
    genreIntro: vi.fn(async () => INTRO),
  },
}));

// Pull the mocked api out for assertion.
import { api } from "../lib/api.js";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

async function renderPage() {
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

/** Item titles in DOM order, pulled from PosterCard links (aria-label === title). */
function posterTitles(): string[] {
  const known = [
    "Alpha Film", "Beta Doc", "Gamma Story", "Delta Tale",
    "Epsilon Yarn", "Zeta Reel", "Theta Cut",
  ];
  return screen
    .getAllByRole("link")
    .map((el) => el.getAttribute("aria-label"))
    .filter((l): l is string => !!l && known.includes(l));
}

// --- tests -----------------------------------------------------------------

describe("GenreExperience discovery + steer controls", () => {
  it("(a) typing in search filters the rail by title", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getAllByText("Alpha Film").length).toBeGreaterThan(0));

    // all present initially (title appears in both the rail + topic spines)
    expect(screen.getAllByText("Beta Doc").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gamma Story").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Zeta Reel").length).toBeGreaterThan(0);

    const box = screen.getByPlaceholderText(/search titles/i);
    fireEvent.change(box, { target: { value: "Beta" } });

    await waitFor(() => {
      expect(screen.queryAllByText("Alpha Film")).toHaveLength(0);
      expect(screen.queryAllByText("Gamma Story")).toHaveLength(0);
      expect(screen.queryAllByText("Zeta Reel")).toHaveLength(0);
    });
    // Beta survives (rail + topic spine)
    expect(screen.getAllByText("Beta Doc").length).toBeGreaterThan(0);
  });

  it("(b) sorting by year reorders so the newest is first", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getAllByText("Alpha Film").length).toBeGreaterThan(0));

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "year" } });

    await waitFor(() => {
      const titles = posterTitles();
      expect(titles[0]).toBe("Beta Doc"); // 2021 highest
    });
  });

  it("(c) toggling mediaType to tv re-queries the server with 'tv'", async () => {
    await renderPage();
    await waitFor(() =>
      expect(api.genreExperience).toHaveBeenCalledWith(
        ["documentary"], "self", "movie", expect.any(Array),
      ),
    );

    const tvButton = screen.getByRole("button", { name: "TV" });
    fireEvent.click(tvButton);

    await waitFor(() => {
      const calls = (api.genreExperience as any).mock.calls;
      const last = calls[calls.length - 1];
      expect(last).toEqual([["documentary"], "self", "tv", expect.any(Array)]);
    });
  });

  it("(d) toggling mode to guided re-queries the server with 'guided'", async () => {
    await renderPage();
    await waitFor(() =>
      expect(api.genreExperience).toHaveBeenCalledWith(
        ["documentary"], "self", "movie", expect.any(Array),
      ),
    );

    const guidedButton = screen.getByRole("button", { name: "guided" });
    fireEvent.click(guidedButton);

    await waitFor(() => {
      const calls = (api.genreExperience as any).mock.calls;
      const last = calls[calls.length - 1];
      expect(last).toEqual([["documentary"], "guided", "movie", expect.any(Array)]);
    });
  });
});

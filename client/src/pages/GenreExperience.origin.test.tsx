import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  key: "science-fiction",
  genres: ["science-fiction"],
  mode: "self",
  intro: null,
  items: [makeItem(1, "Dune"), makeItem(2, "Interstellar"), makeItem(3, "Arrival")],
  // Task 3.2: anchorsUsed drives the world-origin line in the hero.
  anchorsUsed: [
    { tmdbId: 10, mediaType: "movie", title: "Blade Runner", rating: 9, year: 1982 },
    { tmdbId: 11, mediaType: "movie", title: "Arrival", rating: 8, year: 2016 },
    { tmdbId: 12, mediaType: "movie", title: "Solaris", rating: 7, year: 1972 },
  ],
  profileState: "rich",
};

const INTRO = { hook: "Dive in.", tone: "warm", basedOn: [] };

// --- mocks -----------------------------------------------------------------

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => EXPERIENCE),
    genreIntro: vi.fn(async () => INTRO),
  },
}));

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
      <MemoryRouter initialEntries={["/genre/science-fiction"]}>
        <Routes>
          <Route path="/genre/:slug" element={<mod.default />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// --- tests -----------------------------------------------------------------

describe("GenreExperience world-origin line (3.2 / C3)", () => {
  it("renders the hero origin line seeded by anchor titles from data.anchorsUsed", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByTestId("origin-line")).toBeTruthy());

    const line = screen.getByTestId("origin-line");
    expect(line.textContent).toContain("Blade Runner");
    expect(line.textContent).toContain("Arrival");
    // subtle, capped at first 3 anchors
    expect(line.textContent).toContain("Solaris");
  });

  it("omits the origin line when there are no anchors", async () => {
    (EXPERIENCE as any).anchorsUsed = [];
    await renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId("origin-line")).toBeNull();
    (EXPERIENCE as any).anchorsUsed = [
      { tmdbId: 10, mediaType: "movie", title: "Blade Runner", rating: 9, year: 1982 },
      { tmdbId: 11, mediaType: "movie", title: "Arrival", rating: 8, year: 2016 },
      { tmdbId: 12, mediaType: "movie", title: "Solaris", rating: 7, year: 1972 },
    ];
  });
});

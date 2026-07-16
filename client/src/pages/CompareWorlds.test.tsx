import { describe, it, expect, vi, beforeEach } from "vitest";
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

// Two worlds that share one anchor (tmdbId 100) and one overlapping title
// ("Shared Film"), with distinct curator hooks.
const A_EXP = {
  key: "documentary",
  genres: ["documentary"],
  mode: "self" as const,
  intro: { hook: "Documentary thesis A.", tone: "curious", basedOn: [] },
  items: [
    makeItem(100, "Shared Film", { genreIds: [99] }),
    makeItem(1, "Only A", { genreIds: [99] }),
  ],
  anchorsUsed: [
    { tmdbId: 100, mediaType: "movie" as const, title: "Shared Film", rating: 7.5, year: 2005 },
    { tmdbId: 1, mediaType: "movie" as const, title: "Only A", rating: 6.0, year: 2010 },
  ],
  profileState: "rich" as const,
};

const B_EXP = {
  key: "history",
  genres: ["history"],
  mode: "self" as const,
  intro: { hook: "History thesis B.", tone: "grounded", basedOn: [] },
  items: [
    makeItem(100, "Shared Film", { genreIds: [36] }),
    makeItem(2, "Only B", { genreIds: [36] }),
  ],
  anchorsUsed: [
    { tmdbId: 100, mediaType: "movie" as const, title: "Shared Film", rating: 7.5, year: 2005 },
    { tmdbId: 2, mediaType: "movie" as const, title: "Only B", rating: 8.0, year: 2012 },
  ],
  profileState: "rich" as const,
};

// --- mock ------------------------------------------------------------------

// Resolves the two worlds' experiences by slug. Returns undefined → throws so
// we can also simulate a missing world.
const responses: Record<string, any> = {
  documentary: A_EXP,
  history: B_EXP,
};

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async (genres: string[]) => {
      const slug = genres[0];
      const exp = responses[slug];
      if (!exp) throw new Error(`No such world: ${slug}`);
      return exp;
    }),
  },
}));

import { api } from "../lib/api.js";

// --- render helper ---------------------------------------------------------

async function renderCompare(a: string, b: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mod = await import("./CompareWorlds.js");
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/compare/${a}/${b}`]}>
        <Routes>
          <Route path="/compare/:a/:b" element={<mod.default />} />
          <Route path="/compare/:a" element={<mod.default />} />
          <Route path="/genre" element={<div>genre picker</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  (api.genreExperience as any).mockClear();
});

// --- tests -----------------------------------------------------------------

describe("CompareWorlds", () => {
  it("(a) overlays two worlds and shows shared anchors + divergent theses + overlap", async () => {
    await renderCompare("documentary", "history");

    await waitFor(() =>
      expect(screen.getByText("Divergent theses")).toBeInTheDocument(),
    );

    // Both curator hooks render.
    expect(screen.getByText("Documentary thesis A.")).toBeInTheDocument();
    expect(screen.getByText("History thesis B.")).toBeInTheDocument();

    // Shared anchor (tmdbId 100 "Shared Film") appears under Shared anchors.
    expect(screen.getByText("Shared anchors")).toBeInTheDocument();
    // "Shared Film" appears in both the Shared anchors list AND the
    // Overlapping titles list — assert presence, not a single match.
    expect(screen.getAllByText("Shared Film").length).toBeGreaterThanOrEqual(2);

    // Overlapping titles section exists; "Only A"/"Only B" are not shared.
    expect(screen.getByText("Overlapping titles")).toBeInTheDocument();
    expect(screen.queryByText("Only A")).not.toBeInTheDocument();
    expect(screen.queryByText("Only B")).not.toBeInTheDocument();

    // Both worlds' experiences were fetched with the C4 query shape.
    expect(api.genreExperience).toHaveBeenCalledWith(
      ["documentary"], "self", "movie", expect.any(Array),
    );
    expect(api.genreExperience).toHaveBeenCalledWith(
      ["history"], "self", "movie", expect.any(Array),
    );
  });

  it("(b) shows a 'world not found' note when a slug is missing", async () => {
    await renderCompare("documentary", ""); // → URL "/compare/documentary", second world missing
    // Only the valid world `a` is fetched; the empty `b` is skipped
    // (query enabled: !!b → false), so no crash and no redundant fetch.
    expect(api.genreExperience).toHaveBeenCalledTimes(1);
    expect(api.genreExperience).toHaveBeenCalledWith(
      ["documentary"], "self", "movie", expect.any(Array),
    );
    expect(await screen.findByText("World not found.")).toBeInTheDocument();
  });

  it("(c) handles a failed fetch for an invalid slug gracefully", async () => {
    await renderCompare("documentary", "nonexistent-slug");
    await waitFor(() =>
      expect(screen.getByText(/could not be opened/i)).toBeInTheDocument(),
    );
    expect(api.genreExperience).toHaveBeenCalledTimes(2);
  });
});

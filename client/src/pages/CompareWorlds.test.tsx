import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

// Field-identity fixtures: deliberately DECOUPLE the anchor key (tmdbId) from
// the title so a test can prove the diff keys on the right field.
//   - "Anchor M" (tmdbId 100) ↔ "Anchor N, Different Title" (tmdbId 100):
//     SAME tmdbId, DIFFERENT titles → must be a Shared anchor (keyed by tmdbId).
//   - "Same Title Diff Id" in both, but tmdbId 200 (M) vs 300 (N):
//     SAME title, DIFFERENT tmdbId → must NOT be a Shared anchor.
//   - "Overlap Twin" in both with tmdbId 200 (M) vs 999 (N):
//     SAME title, DIFFERENT tmdbId → must be an Overlapping title (keyed by title).
const M_EXP = {
  key: "m-world",
  genres: ["m-world"],
  mode: "self" as const,
  intro: { hook: "M thesis.", tone: "curious", basedOn: [] },
  items: [
    makeItem(200, "Overlap Twin", { genreIds: [99] }),
    makeItem(400, "Solo M", { genreIds: [99] }),
  ],
  anchorsUsed: [
    { tmdbId: 100, mediaType: "movie" as const, title: "Anchor M", rating: 7.0, year: 2001 },
    { tmdbId: 200, mediaType: "movie" as const, title: "Same Title Diff Id", rating: 6.0, year: 2002 },
  ],
  profileState: "rich" as const,
};

const N_EXP = {
  key: "n-world",
  genres: ["n-world"],
  mode: "self" as const,
  intro: { hook: "N thesis.", tone: "grounded", basedOn: [] },
  items: [
    makeItem(999, "Overlap Twin", { genreIds: [36] }),
    makeItem(500, "Solo N", { genreIds: [36] }),
  ],
  anchorsUsed: [
    { tmdbId: 100, mediaType: "movie" as const, title: "Anchor N, Different Title", rating: 7.5, year: 2005 },
    { tmdbId: 300, mediaType: "movie" as const, title: "Same Title Diff Id", rating: 8.0, year: 2012 },
  ],
  profileState: "rich" as const,
};

// --- mock ------------------------------------------------------------------

// Resolves the two worlds' experiences by slug. Returns undefined → throws so
// we can also simulate a missing world.
const responses: Record<string, any> = {
  documentary: A_EXP,
  history: B_EXP,
  "m-world": M_EXP,
  "n-world": N_EXP,
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

  it("(d) keys shared anchors by tmdbId and overlaps by title — field-correctness", async () => {
    // M_EXP / N_EXP deliberately DECOUPLE tmdbId from title:
    //   - tmdbId 100 appears in both worlds as an anchor, but the titles
    //     differ ("Anchor M" vs "Anchor N, Different Title") → must be a
    //     Shared anchor (keyed by tmdbId), rendering M's title.
    //   - "Same Title Diff Id" shares a title across both worlds but has
    //     DIFFERENT tmdbId (200 vs 300) → must NOT be a Shared anchor.
    //   - "Overlap Twin" shares a title but DIFFERENT tmdbId (200 vs 999)
    //     → must be an Overlapping title (items keyed by title).
    await renderCompare("m-world", "n-world");
    await waitFor(() =>
      expect(screen.getByText("Shared anchors")).toBeInTheDocument(),
    );

    const shared = screen.getByText("Shared anchors").closest("section")!;
    expect(within(shared).getByText("Anchor M")).toBeInTheDocument();
    expect(within(shared).queryByText("Anchor N, Different Title")).not.toBeInTheDocument();
    expect(within(shared).queryByText("Same Title Diff Id")).not.toBeInTheDocument();

    const overlap = screen.getByText("Overlapping titles").closest("section")!;
    expect(within(overlap).getByText("Overlap Twin")).toBeInTheDocument();
    // Unique-to-each titles must be excluded from the overlap set.
    expect(within(overlap).queryByText("Solo M")).not.toBeInTheDocument();
    expect(within(overlap).queryByText("Solo N")).not.toBeInTheDocument();
    expect(within(overlap).queryByText("Same Title Diff Id")).not.toBeInTheDocument();
  });
});

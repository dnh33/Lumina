import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { api } from "../lib/api.js";

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
    makeItem(1, "Alpha Film", { voteAverage: 8.5 }),
    makeItem(2, "Beta Doc", { voteAverage: 4.1 }),
    makeItem(3, "Gamma Story", { voteAverage: 8.9 }),
    makeItem(4, "Delta Tale", { voteAverage: 3.7 }),
    makeItem(5, "Epsilon Yarn", { voteAverage: 7.2 }),
    makeItem(6, "Zeta Reel", { voteAverage: 2.9 }),
    makeItem(7, "Theta Cut", { voteAverage: 6.4 }),
  ],
  anchorsUsed: [],
  profileState: "thin",
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
      <MemoryRouter initialEntries={["/genre/documentary"]}>
        <Routes>
          <Route path="/genre/:slug" element={<mod.default />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// --- tests -----------------------------------------------------------------

describe("GenreExperience steering presets (3.5 / C8)", () => {
  it("renders a 'Steering presets' group of chips", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByRole("group", { name: /steering presets/i })).toBeTruthy());
  });

  it("clicking the TV preset re-queries the server with mediaType 'tv'", async () => {
    await renderPage();
    await waitFor(() =>
      expect(api.genreExperience as any).toHaveBeenCalledWith(
        ["documentary"], "self", "movie", expect.any(Array),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Steering preset: TV" }));

    await waitFor(() => {
      const calls = (api.genreExperience as any).mock.calls;
      const last = calls[calls.length - 1];
      expect(last).toEqual([["documentary"], "self", "tv", expect.any(Array)]);
    });
  });

  it("'Less well-known' filters out high-vote titles from the rail", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getAllByText("Alpha Film").length).toBeGreaterThan(0));

    // Alpha (8.5) + Gamma (8.9) are well-known and visible initially.
    expect(screen.getAllByText("Alpha Film").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gamma Story").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /less well-known/i }));

    await waitFor(() => {
      // blockbusters dropped
      expect(screen.queryAllByText("Alpha Film")).toHaveLength(0);
      expect(screen.queryAllByText("Gamma Story")).toHaveLength(0);
      // lesser-known survivors
      expect(screen.getAllByText("Beta Doc").length).toBeGreaterThan(0);
    });
  });

  it("'Surprise me' toggles the shuffle flag on the rail container", async () => {
    await renderPage();
    await waitFor(() => expect(screen.getAllByText("Alpha Film").length).toBeGreaterThan(0));

    expect(document.querySelector('[data-shuffle="false"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /surprise me/i }));

    await waitFor(() => {
      const rail = document.querySelector('[data-shuffle="true"]');
      expect(rail).toBeTruthy();
    });
  });
});

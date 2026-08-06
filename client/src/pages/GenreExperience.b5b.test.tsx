import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";
import { SOUND_KEY } from "../lib/keys.js";

// Mirror GenreExperience.cue.test.tsx: isolate the cue engine as a spy but
// drive the sound gate through the REAL localStorage path (getSoundEnabled()
// reads SOUND_KEY) — no mock-isolation flake.
vi.mock("../lib/worldCue.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/worldCue.js")>();
  return { ...actual, playWorldCue: vi.fn(actual.playWorldCue) };
});

function makeItem(tmdbId: number, title: string, genreIds: number[]) {
  return {
    tmdbId,
    mediaType: "movie" as const,
    title,
    year: 2015,
    overview: "",
    posterPath: null,
    backdropPath: null,
    voteAverage: 7,
    genreIds,
    popularity: 10,
    inLibrary: false,
  };
}

// 7 items (>= NICHE_THRESHOLD of 6) so the world is NOT treated as niche and
// the discovery controls (search box etc.) are rendered. Distinct genres let a
// topic click filter, and a no-match search empties the rail for the warn test.
function buildItems(slug: string) {
  if (slug === "horror") {
    return [
      makeItem(1, "H One", [27]),
      makeItem(2, "H Two", [27]),
      makeItem(3, "H Three", [27]),
      makeItem(4, "H Four", [27]),
      makeItem(5, "H Five", [27]),
      makeItem(6, "H Six", [27]),
      makeItem(7, "H Seven", [27]),
    ];
  }
  // science-fiction
  return [
    makeItem(1, "Sci One", [878, 18]),
    makeItem(2, "Sci Two", [878]),
    makeItem(3, "Sci Three", [878, 18]),
    makeItem(4, "Sci Four", [878]),
    makeItem(5, "Sci Five", [878, 18]),
    makeItem(6, "Sci Six", [878]),
    makeItem(7, "Sci Seven", [878, 18]),
  ];
}

function makeExperience(slug: string) {
  return {
    key: `movie:self:${slug}`,
    genres: [slug],
    mode: "self",
    intro: { hook: "Step into the world.", tone: "awed", basedOn: [] },
    items: buildItems(slug),
    anchorsUsed: [],
    profileState: "rich",
  };
}

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async (slugArgs: any[]) => makeExperience(slugArgs[0][0])),
    genreIntro: vi.fn(async () => ({ hook: "x", tone: "y", basedOn: [] })),
  },
}));

import { playWorldCue } from "../lib/worldCue.js";

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

describe("GenreExperience B5b discover/warn cue wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // gate OFF by default
  });

  it("plays 'discover' when a filter changes (sound on), and not on mount", async () => {
    localStorage.setItem(SOUND_KEY, "1");
    renderAt("science-fiction");

    // B5: the "open" beat fired on mount…
    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "science-fiction" }),
        "open",
      ),
    );
    // …but the first discover beat is suppressed (no mount-equivalent run).
    const discoverOnMount = (playWorldCue as any).mock.calls.filter(
      (c: any[]) => c[1] === "discover",
    );
    expect(discoverOnMount.length).toBe(0);

    // Wait for the rail to paint (query resolves) so the search box exists.
    const box = await screen.findByPlaceholderText(/search titles/i);
    playWorldCue.mockClear();
    await act(async () => {
      fireEvent.change(box, { target: { value: "Sci One" } });
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "science-fiction" }),
        "discover",
      ),
    );
  });

  it("does NOT play 'discover' on a filter change when sound is off", async () => {
    localStorage.removeItem(SOUND_KEY); // gate OFF
    renderAt("science-fiction");

    const box = await screen.findByPlaceholderText(/search titles/i);
    playWorldCue.mockClear();
    await act(async () => {
      fireEvent.change(box, { target: { value: "Sci One" } });
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(playWorldCue).not.toHaveBeenCalled();
  });

  it("plays 'warn' when the active filters empty the rail (sound on)", async () => {
    // `horror` advertises `warn` in its cueBeatMap (open/warn).
    localStorage.setItem(SOUND_KEY, "1");
    renderAt("horror");

    // No empty-state cue yet — the rail has items.
    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "horror" }),
        "open",
      ),
    );
    expect(playWorldCue).not.toHaveBeenCalledWith(
      expect.objectContaining({ slug: "horror" }),
      "warn",
    );

    // Filter down to nothing (search matches no title).
    const box = await screen.findByPlaceholderText(/search titles/i);
    playWorldCue.mockClear();
    await act(async () => {
      fireEvent.change(box, { target: { value: "zzzz-nope" } });
      await new Promise((r) => setTimeout(r, 20));
    });

    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "horror" }),
        "warn",
      ),
    );
  });
});

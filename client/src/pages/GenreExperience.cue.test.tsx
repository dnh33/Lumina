import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";
import { SOUND_KEY } from "../lib/keys.js";

// cuelume's engine touches Web Audio; isolate it so the mount cue is a
// plain spy we can assert against. We do NOT mock sound.js — getSoundEnabled()
// reads SOUND_KEY from localStorage, which is exactly the production path, so
// driving localStorage is the real, deterministic gate (no mock-isolation flake).
vi.mock("../lib/worldCue.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/worldCue.js")>();
  return { ...actual, playWorldCue: vi.fn(actual.playWorldCue) };
});

const experience = {
  key: "movie:self:science-fiction",
  genres: ["science-fiction"],
  mode: "self",
  intro: { hook: "Step into the stars.", tone: "awed", basedOn: [] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Sci One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [878], popularity: 10, inLibrary: false },
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

describe("GenreExperience cue wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default gate: sound OFF (no SOUND_KEY → getSoundEnabled() === false).
    localStorage.clear();
  });

  it("does NOT play the world's 'open' cue on mount when sound is off", async () => {
    // Ensure the gate is OFF via the real localStorage path.
    localStorage.removeItem(SOUND_KEY);
    await act(async () => {
      renderAt("science-fiction");
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(playWorldCue).not.toHaveBeenCalled();
  });

  it("plays the world's 'open' cue on mount when sound is enabled", async () => {
    localStorage.setItem(SOUND_KEY, "1");
    renderAt("science-fiction");
    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "science-fiction" }),
        "open",
      ),
    );
  });
});

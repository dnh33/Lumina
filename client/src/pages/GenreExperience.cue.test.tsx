import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

// cuelume's engine touches Web Audio; isolate it so the mount cue is a
// plain spy we can assert against.
vi.mock("../lib/sound.js", () => ({
  playCue: vi.fn(),
}));
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
  api: { genreExperience: vi.fn(async () => experience) },
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
  beforeEach(() => vi.clearAllMocks());

  it("plays the world's 'open' cue on mount", async () => {
    renderAt("science-fiction");
    await waitFor(() =>
      expect(playWorldCue).toHaveBeenCalledWith(
        expect.objectContaining({ slug: "science-fiction" }),
        "open",
      ),
    );
  });
});

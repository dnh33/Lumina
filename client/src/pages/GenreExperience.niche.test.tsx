import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreExperience from "./GenreExperience.js";

// Niche genre: fewer than NICHE_THRESHOLD (6) titles.
const nicheExperience = {
  key: "movie:self:western",
  genres: ["western"],
  mode: "self",
  intro: { hook: "Ride in.", tone: "spare", basedOn: [] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Western One", year: 1965, overview: "", posterPath: null, backdropPath: null, voteAverage: 8, genreIds: [37], popularity: 5, inLibrary: false },
    { tmdbId: 2, mediaType: "movie", title: "Western Two", year: 1970, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [37], popularity: 4, inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "rich",
};

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => nicheExperience),
    genreIntro: vi.fn(async () => nicheExperience.intro),
  },
}));

function renderNiche() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/genre/western"]}>
        <Routes>
          <Route path="/genre/:slug" element={<GenreExperience />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience niche-gate (R6 / metric 9)", () => {
  it("shows a tailored empty state (not a rail) when below the threshold", async () => {
    renderNiche();
    await waitFor(() => expect(screen.getByText(/The frontier is quiet/i)).toBeDefined());
    // rails should NOT render -> the title cards are absent
    expect(screen.queryByText("Western One")).toBeNull();
    expect(screen.getByText(/2 \/ 6 titles/i)).toBeDefined();
  });
});

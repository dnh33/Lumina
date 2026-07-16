import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
    { tmdbId: 2, mediaType: "movie", title: "Doc Two", year: 2018, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.4, genreIds: [99], popularity: 9, inLibrary: false },
    { tmdbId: 3, mediaType: "movie", title: "Doc Three", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.9, genreIds: [99], popularity: 8, inLibrary: false },
    { tmdbId: 4, mediaType: "movie", title: "Doc Four", year: 2009, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.6, genreIds: [99], popularity: 7, inLibrary: false },
    { tmdbId: 5, mediaType: "movie", title: "Doc Five", year: 2020, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.3, genreIds: [99], popularity: 11, inLibrary: false },
    { tmdbId: 6, mediaType: "movie", title: "Doc Six", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.8, genreIds: [99], popularity: 6, inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "rich",
};

const intro = {
  hook: "Step into the evidence.",
  tone: "hushed, forensic",
  basedOn: ["The Act of Killing"],
};

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => experience),
    genreIntro: vi.fn(async () => intro),
  },
}));

async function renderWorld() {
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

describe("GenreExperience eject-to-/chat (B2 / K1)", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("renders the world WITHOUT a 'Explore with the Companion' eject button", async () => {
    await renderWorld();
    await waitFor(() => expect(screen.getByText(/For You in this World/i)).toBeDefined());
    expect(screen.queryByText(/Explore with the Companion/i)).toBeNull();
  });

  it("never navigates to /chat from the genre page (in-world Companion is the only surface)", async () => {
    await renderWorld();
    await waitFor(() => expect(screen.getByText(/For You in this World/i)).toBeDefined());
    // Interact broadly so any hidden eject path would have fired.
    const buttons = screen.queryAllByRole("button");
    for (const b of buttons) {
      try {
        fireEvent.click(b);
      } catch {
        /* ignore: some buttons need focused state */
      }
    }
    expect(navigate).not.toHaveBeenCalledWith(
      "/chat",
      expect.objectContaining({ state: expect.anything() }),
    );
  });
});

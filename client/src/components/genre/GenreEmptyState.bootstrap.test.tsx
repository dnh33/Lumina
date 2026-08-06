import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import { getGenreWorld } from "../../lib/genreWorld.js";
import { api } from "../../lib/api.js";
import type { CatalogItem } from "../../lib/types.js";

vi.mock("../../lib/api.js", () => ({
  api: {
    search: vi.fn(),
    genreExperience: vi.fn(),
    addToLibrary: vi.fn(),
    ignore: vi.fn(),
    anchorRetired: vi.fn(),
  },
}));

const noirPick: CatalogItem = {
  tmdbId: 274,
  mediaType: "movie",
  title: "Chinatown",
  year: 1974,
  overview: "A private eye uncovers a web of corruption in Los Angeles.",
  posterPath: "/r.jpg",
  backdropPath: null,
  voteAverage: 7.9,
  genreIds: [80, 9648, 53],
  popularity: 40,
  inLibrary: false,
};

function renderEmpty(ui: ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreEmptyState cold-start bootstrap loop (C10)", () => {
  beforeEach(() => {
    vi.mocked(api.search).mockReset();
    vi.mocked(api.genreExperience).mockReset();
    vi.mocked(api.search).mockResolvedValue([]);
    vi.mocked(api.genreExperience).mockResolvedValue({
      key: "test",
      genres: ["crime"],
      mode: "self",
      items: [],
      anchorsUsed: [],
      profileState: "empty",
    });
  });

  it("renders an 'Anchor from library' CTA when onBootstrap is provided and calls it on click", () => {
    const onBootstrap = vi.fn();
    renderEmpty(
      <GenreEmptyState
        world={getGenreWorld("comedy")}
        count={1}
        threshold={6}
        onBootstrap={onBootstrap}
      />,
    );

    const cta = screen.getByRole("button", { name: /anchor from library/i });
    expect(cta).toBeDefined();
    // Tailored (Warm Interior) copy must remain intact even with the CTA present.
    expect(screen.getByText(/A quiet room/i)).toBeDefined();

    fireEvent.click(cta);
    expect(onBootstrap).toHaveBeenCalledTimes(1);
  });

  it("renders no library-anchor CTA when onBootstrap is omitted", () => {
    renderEmpty(<GenreEmptyState world={getGenreWorld("comedy")} count={1} threshold={6} />);
    expect(screen.queryByRole("button", { name: /anchor from library/i })).toBeNull();
  });

  it("renders a Threshold suggestion strip from neighbor rails without removing empty copy", async () => {
    vi.mocked(api.genreExperience).mockResolvedValue({
      key: "crime",
      genres: ["crime"],
      mode: "self",
      items: [noirPick],
      anchorsUsed: [],
      profileState: "empty",
    });
    renderEmpty(
      <GenreEmptyState
        world={getGenreWorld("film-noir")}
        count={0}
        threshold={6}
        onBootstrap={() => {}}
      />,
    );

    expect(screen.getByText(/A threshold not yet crossed/i)).toBeDefined();
    expect(screen.getByText(/0 \/ 6 titles/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /anchor from library/i })).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Chinatown/i)).toBeDefined();
    });
    expect(screen.getByText(/Cross the threshold/i)).toBeDefined();
    expect(api.genreExperience).toHaveBeenCalled();
    expect(screen.getByText(/Shadows · 1974/i)).toBeDefined();
    expect(
      screen.getByRole("button", { name: /Step through with one title: Chinatown/i }),
    ).toBeDefined();
  });
});

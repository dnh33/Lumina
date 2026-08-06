import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import { getGenreWorld } from "../../lib/genreWorld.js";
import { api } from "../../lib/api.js";

vi.mock("../../lib/api.js", () => ({
  api: {
    search: vi.fn(),
    genreExperience: vi.fn().mockResolvedValue({
      key: "stub",
      genres: [],
      mode: "self",
      items: [],
      anchorsUsed: [],
      profileState: "empty",
    }),
  },
}));

function renderEmpty(ui: ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("GenreEmptyState", () => {
  beforeEach(() => {
    vi.mocked(api.search).mockReset();
    vi.mocked(api.search).mockResolvedValue([]);
  });

  it("shows Frontier metaphor copy for the western world", () => {
    renderEmpty(<GenreEmptyState world={getGenreWorld("western")} count={2} threshold={6} />);
    expect(screen.getByText(/A frontier barely marked/i)).toBeDefined();
    expect(screen.getByText(/2 \/ 6 on shelf/i)).toBeDefined();
    expect(screen.getByTestId("genre-shelf-honesty").textContent).toMatch(
      /Thin shelf/i,
    );
    expect(screen.getByTestId("genre-shelf-honesty").textContent).toMatch(
      /catalog live/i,
    );
    expect(screen.getByTestId("genre-shelf-thin").getAttribute("data-empty-kind")).toBe(
      "shelf-thin",
    );
  });

  it("shows Panel metaphor copy for the music world", () => {
    renderEmpty(<GenreEmptyState world={getGenreWorld("music")} count={1} threshold={6} />);
    expect(screen.getByText(/A blank panel/i)).toBeDefined();
  });

  it("shows Reading Room metaphor copy for the war-politics world", () => {
    renderEmpty(<GenreEmptyState world={getGenreWorld("war-politics")} count={3} threshold={6} />);
    expect(screen.getByText(/A quiet reading room/i)).toBeDefined();
    expect(screen.queryByText(/\bEmpty\b/i)).toBeNull();
  });

  it("falls back to thin-shelf copy — never empty-world", () => {
    renderEmpty(<GenreEmptyState world={getGenreWorld("action")} count={4} threshold={6} />);
    expect(screen.getByText(/A thin shelf/i)).toBeDefined();
    expect(screen.queryByText(/A thin world/i)).toBeNull();
    expect(screen.getByTestId("genre-shelf-honesty").textContent).toMatch(/catalog live/i);
  });
});

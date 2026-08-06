import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import type { GenreWorld } from "../../lib/genreWorld.js";
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

/** Build a minimal world with just a metaphor (C6: per-metaphor copy). */
const worldWith = (metaphor: GenreWorld["metaphor"]): GenreWorld => ({
  slug: "stub",
  metaphor,
  register: {
    lexicon: [],
    tonePrompt: "",
    cueBeatMap: [],
    accent: "#ffffff",
    moods: [],
  },
  modules: [],
});

function renderEmpty(ui: ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("GenreEmptyState per-metaphor copy (Task 7.2 / C6)", () => {
  beforeEach(() => {
    vi.mocked(api.search).mockReset();
    vi.mocked(api.search).mockResolvedValue([]);
  });

  it("renders Constellation-specific copy for a Constellation world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Constellation")} count={0} threshold={6} />);
    expect(
      screen.getByText(/A constellation waiting to be charted/i),
    ).toBeDefined();
    expect(screen.getByText(/add a title to light the first star/i)).toBeDefined();
  });

  it("renders Frontier-specific copy for a Frontier world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Frontier")} count={0} threshold={6} />);
    expect(screen.getByText(/A frontier barely marked/i)).toBeDefined();
    expect(screen.getByText(/drop a title to mark the first trail/i)).toBeDefined();
  });

  it("renders Reading Room-specific copy for a Reading Room world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Reading Room")} count={0} threshold={6} />);
    expect(screen.getByText(/A quiet reading room/i)).toBeDefined();
    expect(screen.getByText(/shelve a title to begin/i)).toBeDefined();
    expect(screen.queryByText(/An empty reading room/i)).toBeNull();
  });

  it("renders Warm Interior-specific copy for a Warm Interior world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Warm Interior")} count={0} threshold={6} />);
    expect(screen.getByText(/A quiet room/i)).toBeDefined();
    expect(screen.getByText(/add a title to warm it/i)).toBeDefined();
  });

  it("renders Threshold-specific copy for a Threshold world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Threshold")} count={0} threshold={6} />);
    expect(screen.getByText(/A threshold not yet crossed/i)).toBeDefined();
    expect(screen.getByText(/add a title to step through/i)).toBeDefined();
  });

  it("renders Panel-specific copy for a Panel world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Panel")} count={0} threshold={6} />);
    expect(screen.getByText(/A blank panel/i)).toBeDefined();
    expect(screen.getByText(/add a title to start the show/i)).toBeDefined();
  });

  it("renders Generic thin-shelf copy — not empty-world", () => {
    renderEmpty(<GenreEmptyState world={worldWith("Generic")} count={2} threshold={6} />);
    expect(screen.getByText(/A thin shelf/i)).toBeDefined();
    expect(screen.getByText(/Only 2 titles on the vault shelf/i)).toBeDefined();
    expect(screen.queryByText(/A thin world/i)).toBeNull();
  });

  it("falls back to thin-shelf copy for an unknown metaphor", () => {
    // Cast through unknown to simulate a runtime metaphor value not in the union.
    const unknown = worldWith("Generic") as GenreWorld;
    (unknown as { metaphor: string }).metaphor = "Nebula";
    renderEmpty(<GenreEmptyState world={unknown} count={3} threshold={6} />);
    expect(screen.getByText(/A thin shelf/i)).toBeDefined();
    expect(screen.getByText(/Only 3 titles on the vault shelf/i)).toBeDefined();
  });

  it("preserves the onBootstrap CTA across all metaphors", () => {
    const onBootstrap = vi.fn();
    renderEmpty(
      <GenreEmptyState
        world={worldWith("Constellation")}
        count={0}
        threshold={6}
        onBootstrap={onBootstrap}
      />,
    );
    const cta = screen.getByRole("button", { name: /anchor from library/i });
    expect(cta).toBeDefined();
    fireEvent.click(cta);
    expect(onBootstrap).toHaveBeenCalledTimes(1);
  });
});

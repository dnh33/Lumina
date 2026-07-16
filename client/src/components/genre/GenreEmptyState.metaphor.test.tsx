import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import type { GenreWorld } from "../../lib/genreWorld.js";

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

describe("GenreEmptyState per-metaphor copy (Task 7.2 / C6)", () => {
  it("renders Constellation-specific copy for a Constellation world", () => {
    render(<GenreEmptyState world={worldWith("Constellation")} count={0} threshold={6} />);
    expect(
      screen.getByText(/A constellation waiting to be charted/i),
    ).toBeDefined();
    expect(screen.getByText(/add a title to light the first star/i)).toBeDefined();
  });

  it("renders Frontier-specific copy for a Frontier world", () => {
    render(<GenreEmptyState world={worldWith("Frontier")} count={0} threshold={6} />);
    expect(screen.getByText(/An uncharted frontier/i)).toBeDefined();
    expect(screen.getByText(/drop a title to mark the first trail/i)).toBeDefined();
  });

  it("renders Reading Room-specific copy for a Reading Room world", () => {
    render(<GenreEmptyState world={worldWith("Reading Room")} count={0} threshold={6} />);
    expect(screen.getByText(/An empty reading room/i)).toBeDefined();
    expect(screen.getByText(/shelve a title to begin/i)).toBeDefined();
  });

  it("renders Warm Interior-specific copy for a Warm Interior world", () => {
    render(<GenreEmptyState world={worldWith("Warm Interior")} count={0} threshold={6} />);
    expect(screen.getByText(/A quiet room/i)).toBeDefined();
    expect(screen.getByText(/add a title to warm it/i)).toBeDefined();
  });

  it("renders Threshold-specific copy for a Threshold world", () => {
    render(<GenreEmptyState world={worldWith("Threshold")} count={0} threshold={6} />);
    expect(screen.getByText(/A threshold not yet crossed/i)).toBeDefined();
    expect(screen.getByText(/add a title to step through/i)).toBeDefined();
  });

  it("renders Panel-specific copy for a Panel world", () => {
    render(<GenreEmptyState world={worldWith("Panel")} count={0} threshold={6} />);
    expect(screen.getByText(/A blank panel/i)).toBeDefined();
    expect(screen.getByText(/add a title to start the show/i)).toBeDefined();
  });

  it("renders Generic copy for a Generic world", () => {
    render(<GenreEmptyState world={worldWith("Generic")} count={2} threshold={6} />);
    expect(screen.getByText(/A thin world/i)).toBeDefined();
    expect(screen.getByText(/Only 2 titles lined up/i)).toBeDefined();
  });

  it("falls back to generic copy for an unknown metaphor", () => {
    // Cast through unknown to simulate a runtime metaphor value not in the union.
    const unknown = worldWith("Generic") as GenreWorld;
    (unknown as { metaphor: string }).metaphor = "Nebula";
    render(<GenreEmptyState world={unknown} count={3} threshold={6} />);
    expect(screen.getByText(/A thin world/i)).toBeDefined();
    expect(screen.getByText(/Only 3 titles lined up/i)).toBeDefined();
  });

  it("preserves the onBootstrap CTA across all metaphors", () => {
    const onBootstrap = vi.fn();
    render(
      <GenreEmptyState
        world={worldWith("Constellation")}
        count={0}
        threshold={6}
        onBootstrap={onBootstrap}
      />,
    );
    const cta = screen.getByRole("button", { name: /anchor this world/i });
    expect(cta).toBeDefined();
    fireEvent.click(cta);
    expect(onBootstrap).toHaveBeenCalledTimes(1);
  });
});

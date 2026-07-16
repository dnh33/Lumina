import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import { getGenreWorld } from "../../lib/genreWorld.js";

describe("GenreEmptyState", () => {
  it("shows Frontier metaphor copy for the western world", () => {
    render(<GenreEmptyState world={getGenreWorld("western")} count={2} threshold={6} />);
    expect(screen.getByText(/An uncharted frontier/i)).toBeDefined();
    expect(screen.getByText(/2 \/ 6 titles/i)).toBeDefined();
  });

  it("shows Panel metaphor copy for the music world", () => {
    render(<GenreEmptyState world={getGenreWorld("music")} count={1} threshold={6} />);
    expect(screen.getByText(/A blank panel/i)).toBeDefined();
  });

  it("shows Reading Room metaphor copy for the war-politics world", () => {
    render(<GenreEmptyState world={getGenreWorld("war-politics")} count={3} threshold={6} />);
    expect(screen.getByText(/An empty reading room/i)).toBeDefined();
  });

  it("falls back to generic copy for a world without a bespoke metaphor", () => {
    render(<GenreEmptyState world={getGenreWorld("action")} count={4} threshold={6} />);
    expect(screen.getByText(/A thin world/i)).toBeDefined();
  });
});

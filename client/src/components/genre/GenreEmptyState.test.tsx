import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import { getGenreWorld } from "../../lib/genreWorld.js";

describe("GenreEmptyState", () => {
  it("shows Western-specific copy for the western world", () => {
    render(<GenreEmptyState world={getGenreWorld("western")} count={2} threshold={6} />);
    expect(screen.getByText(/The frontier is quiet/i)).toBeDefined();
    expect(screen.getByText(/2 \/ 6 titles/i)).toBeDefined();
  });

  it("shows Music-specific copy for the music world", () => {
    render(<GenreEmptyState world={getGenreWorld("music")} count={1} threshold={6} />);
    expect(screen.getByText(/The stage is dark/i)).toBeDefined();
  });

  it("shows War&Politics-specific copy", () => {
    render(<GenreEmptyState world={getGenreWorld("war-politics")} count={3} threshold={6} />);
    expect(screen.getByText(/The archive is thin/i)).toBeDefined();
  });

  it("falls back to generic copy for a world without specific copy", () => {
    render(<GenreEmptyState world={getGenreWorld("comedy")} count={4} threshold={6} />);
    expect(screen.getByText(/A thin world/i)).toBeDefined();
  });
});

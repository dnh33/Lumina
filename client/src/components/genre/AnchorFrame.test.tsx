import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AnchorFrame } from "./AnchorFrame.js";
import type { GenreAnchor, GenreWorld } from "../../lib/types.js";
import { getGenreWorld } from "../../lib/genreWorld.js";

const world: GenreWorld = getGenreWorld("western");

const anchors: GenreAnchor[] = [
  { tmdbId: 123, mediaType: "movie", title: "The Good, the Bad and the Ugly", rating: 9 },
  { tmdbId: 456, mediaType: "tv", title: "Deadwood", rating: 8 },
];

describe("AnchorFrame", () => {
  it("renders a link to /title for each library anchor", () => {
    render(
      <MemoryRouter>
        <AnchorFrame anchors={anchors} world={world} />
      </MemoryRouter>,
    );

    const movieLink = screen.getByRole("link", { name: /The Good, the Bad and the Ugly/i });
    expect(movieLink).toHaveAttribute("href", "/title/movie/123");

    const tvLink = screen.getByRole("link", { name: /Deadwood/i });
    expect(tvLink).toHaveAttribute("href", "/title/tv/456");
  });
});

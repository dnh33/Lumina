import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenreModules } from "./GenreModules.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1995, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 2, mediaType: "movie", title: "Mid", year: 2005, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
];

describe("GenreModules", () => {
  it("renders the Timeline scrubber when 'timeline' is in modules", () => {
    render(<GenreModules modules={["timeline"]} items={items} />);
    expect(screen.getByText(/1990s/)).toBeDefined();
  });

  it("renders nothing extra when modules is empty", () => {
    const { container } = render(<GenreModules modules={[]} items={items} />);
    expect(container.firstChild).toBeNull();
  });
});

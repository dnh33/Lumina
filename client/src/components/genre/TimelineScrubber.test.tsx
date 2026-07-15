import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

describe("TimelineScrubber", () => {
  it("groups items into decade buckets", () => {
    render(<TimelineScrubber items={items} />);
    expect(screen.getByText("1990s")).toBeDefined();
    expect(screen.getByText("2000s")).toBeDefined();
    expect(screen.getByText("2010s")).toBeDefined();
  });

  it("scrubbing filters visible items to the selected decade", () => {
    render(<TimelineScrubber items={items} />);
    // default selection = earliest decade (1990s) -> only "Old Film" visible
    expect(screen.getByText("Old Film")).toBeDefined();
    expect(screen.queryByText("Modern One")).toBeNull();
    // click 2010s
    fireEvent.click(screen.getByText("2010s", { selector: "button" }));
    expect(screen.getByText("Modern One")).toBeDefined();
    expect(screen.queryByText("Old Film")).toBeNull();
  });
});

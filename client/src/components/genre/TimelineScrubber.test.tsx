import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TimelineScrubber, pickPreferredDecade } from "./TimelineScrubber.js";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

function renderScrubber(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("pickPreferredDecade", () => {
  it("picks the densest decade", () => {
    const dense: CatalogItem[] = [
      ...items,
      { tmdbId: 4, mediaType: "movie", title: "Also 90s", year: 1998, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
    ];
    expect(pickPreferredDecade(dense)).toBe(1990);
  });

  it("biases toward anchor decades on density ties", () => {
    const anchors: GenreAnchor[] = [
      { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, rating: null },
    ];
    // Equal density (1 each) — anchor in 2000s wins over more-recent 2010s
    expect(pickPreferredDecade(items, anchors)).toBe(2000);
  });

  it("prefers most recent on pure ties without anchors", () => {
    expect(pickPreferredDecade(items)).toBe(2010);
  });
});

describe("TimelineScrubber", () => {
  it("groups items into decade buckets", () => {
    renderScrubber(<TimelineScrubber items={items} />);
    expect(screen.getByText("1990s")).toBeDefined();
    expect(screen.getByText("2000s")).toBeDefined();
    expect(screen.getByText("2010s")).toBeDefined();
  });

  it("defaults uncontrolled selection to preferred (densest/recent) decade", () => {
    renderScrubber(<TimelineScrubber items={items} />);
    // Equal density → most recent (2010s)
    expect(screen.getByRole("link", { name: /Modern One/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: /Old Film/ })).toBeNull();
    expect(screen.getByTestId("timeline-tray")).toBeDefined();
  });

  it("scrubbing filters visible items to the selected decade", () => {
    renderScrubber(<TimelineScrubber items={items} />);
    fireEvent.click(screen.getByRole("tab", { name: /1990s/ }));
    expect(screen.getByRole("link", { name: /Old Film/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: /Modern One/ })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /2010s/ }));
    expect(screen.getByRole("link", { name: /Modern One/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: /Old Film/ })).toBeNull();
  });
});

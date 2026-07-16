import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

describe("TimelineScrubber accessibility (C3)", () => {
  it("exposes a tablist labelled by its heading with tabs pointing at the rail", () => {
    render(<TimelineScrubber items={items} />);

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-labelledby", "timeline-heading");

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);

    for (const tab of tabs) {
      expect(tab).toHaveAttribute("aria-selected");
      expect(tab).toHaveAttribute("aria-controls", "timeline-rail");
      expect(tab.id).toMatch(/^timeline-tab-/);
    }

    // exactly one tab is selected at a time
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected.length).toBe(1);
  });
});

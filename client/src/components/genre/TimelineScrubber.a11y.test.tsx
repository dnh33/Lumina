import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

describe("TimelineScrubber accessibility (C3)", () => {
  it("exposes a tablist labelled by its heading with tabs pointing at the rail", () => {
    render(
      <MemoryRouter>
        <TimelineScrubber items={items} />
      </MemoryRouter>,
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("aria-labelledby", "timeline-heading");

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);

    for (const tab of tabs) {
      expect(tab).toHaveAttribute("aria-selected");
      expect(tab).toHaveAttribute("aria-controls", "timeline-rail");
      expect(tab.id).toMatch(/^timeline-tab-/);
    }

    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected.length).toBe(1);
    expect(selected[0]).toHaveAttribute("tabIndex", "0");
    const unselected = tabs.filter((t) => t.getAttribute("aria-selected") !== "true");
    for (const tab of unselected) {
      expect(tab).toHaveAttribute("tabIndex", "-1");
    }
  });

  it("keeps prev/next arrows outside the tablist", () => {
    const onDecade = () => {};
    render(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={2010} onDecade={onDecade} />
      </MemoryRouter>,
    );

    const tablist = screen.getByRole("tablist");
    expect(tablist.querySelector('[aria-label="Previous decade"]')).toBeNull();
    expect(tablist.querySelector('[aria-label="Next decade"]')).toBeNull();
    expect(screen.getByRole("button", { name: "Previous decade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next decade" })).toBeInTheDocument();
  });

  it("moves selection with arrow keys inside the tablist", () => {
    let decade: number | null = 2010;
    const onDecade = (d: number | null) => {
      decade = d;
    };
    const { rerender } = render(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={decade} onDecade={onDecade} />
      </MemoryRouter>,
    );

    const tablist = screen.getByRole("tablist");
    const active = screen.getByRole("tab", { name: /2010s/ });
    active.focus();
    fireEvent.keyDown(tablist, { key: "ArrowLeft" });

    rerender(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={decade} onDecade={onDecade} />
      </MemoryRouter>,
    );

    expect(decade).toBe(2000);
  });

  it("exposes a focusable title tray when a decade is zoomed", () => {
    render(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={2010} onDecade={() => {}} />
      </MemoryRouter>,
    );

    const tray = screen.getByRole("region", { name: /Title tray, 2010s/i });
    expect(tray).toHaveAttribute("tabIndex", "0");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "timeline-rail");
  });
});

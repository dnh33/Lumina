import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

/** Helper that renders in controlled mode with a deterministic era-thesis. */
function renderZoomed(selectedDecade: number | null, eraThesis?: string) {
  return render(
    <TimelineScrubber
      items={items}
      selectedDecade={selectedDecade}
      onDecade={() => {}}
      eraThesis={eraThesis}
    />,
  );
}

describe("TimelineScrubber decade zoom (D1)", () => {
  it("marks the scrubber as zoomed and emphasizes the selected decade tab", () => {
    const { container } = renderZoomed(2010, "Era thesis for the 2010s: Constellation framed by 1 title.");
    const section = container.querySelector("section")!;
    expect(section).toHaveAttribute("data-zoomed", "true");

    const tab = screen.getByRole("tab", { name: "2010s" });
    expect(tab).toHaveAttribute("data-zoom", "true");
    // non-selected tabs must NOT be in the zoomed state
    expect(screen.getByRole("tab", { name: "1990s" })).not.toHaveAttribute("data-zoom", "true");
  });

  it("renders the deterministic era-thesis line for the selected decade", () => {
    renderZoomed(1990, "Era thesis for the 1990s: Constellation framed by 1 title.");
    const thesis = screen.getByTestId("era-thesis");
    expect(thesis.textContent).toContain("1990s");
    expect(thesis.textContent).toContain("Constellation");
  });

  it("removes zoom + era-thesis when the decade is cleared (null)", () => {
    const { container, rerender } = renderZoomed(2000, "Era thesis for the 2000s: Constellation framed by 1 title.");
    expect(container.querySelector("section")!).toHaveAttribute("data-zoomed", "true");
    expect(screen.queryByTestId("era-thesis")).not.toBeNull();

    rerender(
      <TimelineScrubber items={items} selectedDecade={null} onDecade={() => {}} eraThesis={undefined} />,
    );
    expect(container.querySelector("section")!).toHaveAttribute("data-zoomed", "false");
    expect(screen.queryByTestId("era-thesis")).toBeNull();
  });

  it("keeps existing filter behavior: clicking a tab still reports via onDecade", () => {
    let picked: number | null = null;
    render(
      <TimelineScrubber
        items={items}
        selectedDecade={1990}
        onDecade={(d) => { picked = d; }}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "2000s" }));
    expect(picked).toBe(2000);
  });
});

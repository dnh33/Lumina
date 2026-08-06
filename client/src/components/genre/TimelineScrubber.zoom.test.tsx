import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
    <MemoryRouter>
      <TimelineScrubber
        items={items}
        selectedDecade={selectedDecade}
        onDecade={() => {}}
        eraThesis={eraThesis}
      />
    </MemoryRouter>,
  );
}

describe("TimelineScrubber decade zoom (D1)", () => {
  it("marks the scrubber as zoomed and emphasizes the selected decade tab", () => {
    const { container } = renderZoomed(2010, "Era thesis for the 2010s: Constellation framed by 1 title.");
    const section = container.querySelector("section")!;
    expect(section).toHaveAttribute("data-zoomed", "true");

    const tab = screen.getByRole("tab", { name: /2010s/ });
    expect(tab).toHaveAttribute("data-zoom", "true");
    expect(screen.getByRole("tab", { name: /1990s/ })).not.toHaveAttribute("data-zoom", "true");
  });

  it("renders the deterministic era-thesis line without decade echo", () => {
    renderZoomed(1990, "1 title in the Constellation.");
    const thesis = screen.getByTestId("era-thesis");
    expect(thesis.textContent).toContain("Constellation");
    expect(thesis.textContent).not.toMatch(/1990s/);
  });

  it("removes zoom + era-thesis when the decade is cleared (null)", () => {
    const { container, rerender } = renderZoomed(2000, "Era thesis for the 2000s: Constellation framed by 1 title.");
    expect(container.querySelector("section")!).toHaveAttribute("data-zoomed", "true");
    expect(screen.queryByTestId("era-thesis")).not.toBeNull();

    rerender(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={null} onDecade={() => {}} eraThesis={undefined} />
      </MemoryRouter>,
    );
    expect(container.querySelector("section")!).toHaveAttribute("data-zoomed", "false");
    expect(screen.queryByTestId("era-thesis")).toBeNull();
  });

  it("keeps existing filter behavior: clicking a tab still reports via onDecade", () => {
    let picked: number | null = null;
    render(
      <MemoryRouter>
        <TimelineScrubber
          items={items}
          selectedDecade={1990}
          onDecade={(d) => {
            picked = d;
          }}
        />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("tab", { name: /2000s/ }));
    expect(picked).toBe(2000);
  });
});

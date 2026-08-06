import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1994, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 2, mediaType: "movie", title: "Y2K Flick", year: 2003, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: null, genreIds: [], popularity: null },
];

/** Helper that renders in controlled mode and returns the arrows. */
function renderControlled(selectedDecade: number | null, onDecade = vi.fn()) {
  return render(
    <MemoryRouter>
      <TimelineScrubber items={items} selectedDecade={selectedDecade} onDecade={onDecade} />
    </MemoryRouter>,
  );
}

describe("TimelineScrubber (controlled + arrows)", () => {
  it("reflects the externally-controlled selectedDecade", () => {
    renderControlled(2010);
    expect(screen.getByRole("link", { name: /Modern One/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: /Old Film/ })).toBeNull();
    expect(screen.getByRole("tab", { name: /2010s/ })).toHaveAttribute("aria-selected", "true");
  });

  it("shows All eras as decade summary (not a poster warehouse) when selectedDecade is null", () => {
    renderControlled(null);
    expect(screen.getByRole("tab", { name: /All eras/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("timeline-era-summary")).toBeDefined();
    expect(screen.queryByTestId("timeline-tray")).toBeNull();
    expect(screen.getByRole("group", { name: /Eras overview/i })).toBeDefined();
  });

  it("zooms into a decade tray when an All-eras summary peek is clicked", () => {
    const onDecade = vi.fn();
    renderControlled(null, onDecade);
    fireEvent.click(screen.getByTestId("era-summary-1990"));
    expect(onDecade).toHaveBeenCalledWith(1990);
  });

  it("opens the internal-scroll tray when a decade is selected", () => {
    renderControlled(2010);
    expect(screen.getByTestId("timeline-tray")).toBeDefined();
    expect(screen.getByRole("link", { name: /Modern One/ })).toBeDefined();
    expect(screen.queryByTestId("timeline-era-summary")).toBeNull();
  });

  it("marks tray poster cells for content-visibility (scroll perf)", () => {
    renderControlled(2010);
    const tray = screen.getByTestId("timeline-tray");
    const cells = tray.querySelectorAll("li");
    expect(cells.length).toBe(1);
    for (const cell of cells) {
      expect(cell.className).toMatch(/content-visibility:auto/);
      expect(cell.className).toMatch(/contain-intrinsic-size:auto_260px/);
    }
  });

  it("calls onDecade when a decade tab is clicked (no internal state drift)", () => {
    const onDecade = vi.fn();
    renderControlled(null, onDecade);
    fireEvent.click(screen.getByRole("tab", { name: /1990s/ }));
    expect(onDecade).toHaveBeenCalledWith(1990);
  });

  it("calls onDecade(null) when All eras is clicked while zoomed", () => {
    const onDecade = vi.fn();
    renderControlled(2010, onDecade);
    fireEvent.click(screen.getByRole("tab", { name: /All eras/ }));
    expect(onDecade).toHaveBeenCalledWith(null);
  });

  it("renders prev/next arrows that step to adjacent decades", () => {
    const onDecade = vi.fn();
    renderControlled(2000, onDecade);
    fireEvent.click(screen.getByRole("button", { name: /previous decade/i }));
    expect(onDecade).toHaveBeenCalledWith(1990);
    fireEvent.click(screen.getByRole("button", { name: /next decade/i }));
    expect(onDecade).toHaveBeenCalledWith(2010);
  });

  it("disables the previous arrow at the earliest decade and next at the latest", () => {
    const { rerender } = renderControlled(1990, vi.fn());
    const prev = screen.getByRole("button", { name: /previous decade/i });
    const next = screen.getByRole("button", { name: /next decade/i });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    rerender(
      <MemoryRouter>
        <TimelineScrubber items={items} selectedDecade={2010} onDecade={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: /previous decade/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next decade/i })).toBeDisabled();
  });
});

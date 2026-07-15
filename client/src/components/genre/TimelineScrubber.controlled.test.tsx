import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    <TimelineScrubber items={items} selectedDecade={selectedDecade} onDecade={onDecade} />,
  );
}

describe("TimelineScrubber (controlled + arrows)", () => {
  it("reflects the externally-controlled selectedDecade", () => {
    renderControlled(2010);
    // 2010s selected externally -> its item visible, others not
    expect(screen.getByText("Modern One")).toBeDefined();
    expect(screen.queryByText("Old Film")).toBeNull();
    expect(screen.getByRole("tab", { name: "2010s" })).toHaveAttribute("aria-selected", "true");
  });

  it("calls onDecade when a decade tab is clicked (no internal state drift)", () => {
    const onDecade = vi.fn();
    renderControlled(null, onDecade);
    fireEvent.click(screen.getByRole("tab", { name: "1990s" }));
    expect(onDecade).toHaveBeenCalledWith(1990);
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

    rerender(<TimelineScrubber items={items} selectedDecade={2010} onDecade={vi.fn()} />);
    expect(screen.getByRole("button", { name: /previous decade/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /next decade/i })).toBeDisabled();
  });
});

/**
 * Task 3.4 (C9) — Taste-evolution overlay on the TimelineScrubber.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";

const item = (tmdbId: number, year: number): CatalogItem => ({
  tmdbId,
  mediaType: "movie",
  title: `Title ${tmdbId}`,
  year,
  overview: "",
  posterPath: null,
  backdropPath: null,
  voteAverage: null,
  genreIds: [],
  popularity: null,
});

describe("TimelineScrubber taste overlay (C9)", () => {
  it("renders an anchor marker on the decade whose anchors are present, and none otherwise", () => {
    const items: CatalogItem[] = [item(1, 2015), item(2, 1994)];
    const anchors: GenreAnchor[] = [
      { tmdbId: 10, mediaType: "movie", title: "X", rating: null, year: 2015 },
    ];

    const { container, getByText } = render(
      <MemoryRouter>
        <TimelineScrubber items={items} anchors={anchors} />
      </MemoryRouter>,
    );

    expect(getByText("2010s")).toBeTruthy();
    expect(getByText("1990s")).toBeTruthy();

    const marker2010 = container.querySelector('[data-testid="anchor-2010"]');
    expect(marker2010).not.toBeNull();
    expect(marker2010?.getAttribute("aria-label")).toBe("Taste anchor in the 2010s");

    const marker1990 = container.querySelector('[data-testid="anchor-1990"]');
    expect(marker1990).toBeNull();
  });

  it("does not render any markers when no anchors are supplied", () => {
    const items: CatalogItem[] = [item(1, 2008)];
    const { container } = render(
      <MemoryRouter>
        <TimelineScrubber items={items} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-testid^="anchor-"]')).toBeNull();
  });
});

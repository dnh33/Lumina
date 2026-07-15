/**
 * Task 3.4 (C9) — Taste-evolution overlay on the TimelineScrubber.
 *
 * Anchors (the user's taste reference titles) live in `anchorsUsed` on the
 * GenreExperience response. We thread them into TimelineScrubber and, for each
 * decade that has at least one anchor, render a small marker under the decade
 * tab so the user can see WHERE their taste lives on the era axis.
 *
 * This is strictly additive: it must not change decade filtering behaviour.
 */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
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
    // One anchor in the 2010s, none in the 1990s.
    const anchors: GenreAnchor[] = [
      { tmdbId: 10, mediaType: "movie", title: "X", rating: null, year: 2015 },
    ];

    const { container, getByText } = render(
      <TimelineScrubber items={items} anchors={anchors} />,
    );

    // The decade tabs still render as before.
    expect(getByText("2010s")).toBeTruthy();
    expect(getByText("1990s")).toBeTruthy();

    // 2010s has an anchor → marker present.
    const marker2010 = container.querySelector('[data-testid="anchor-2010"]');
    expect(marker2010).not.toBeNull();
    expect(marker2010?.getAttribute("aria-label")).toBe("Taste anchor in the 2010s");

    // 1990s has no anchor → no marker.
    const marker1990 = container.querySelector('[data-testid="anchor-1990"]');
    expect(marker1990).toBeNull();
  });

  it("does not render any markers when no anchors are supplied", () => {
    const items: CatalogItem[] = [item(1, 2008)];
    const { container } = render(<TimelineScrubber items={items} />);
    expect(container.querySelector('[data-testid^="anchor-"]')).toBeNull();
  });
});

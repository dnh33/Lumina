import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TitleCard } from "./TitleCard.js";
import type { CatalogItem } from "../../lib/types.js";

const item: CatalogItem = {
  tmdbId: 1,
  mediaType: "movie",
  title: "The Cold Blue",
  year: 2018,
  overview: "",
  posterPath: "/abc.jpg",
  backdropPath: null,
  voteAverage: 7.5,
  genreIds: [99],
  popularity: 10,
  inLibrary: false,
  imdbRating: 8.1,
};

describe("TitleCard", () => {
  it("composes title, director, rating, and thesis when all fields present", () => {
    render(<TitleCard item={item} director="Jane Doe" rating={8.1} thesis="A tight, moral grey doc." />);
    expect(screen.getByText("The Cold Blue")).toBeDefined();
    expect(screen.getByText(/Dir\. Jane Doe/)).toBeDefined();
    expect(screen.getByText(/★ 8\.1/)).toBeDefined();
    expect(screen.getByText(/A tight, moral grey doc\./)).toBeDefined();
  });

  it("renders gracefully (omits lines) when enrichment fields are absent", () => {
    const bare: CatalogItem = { ...item, posterPath: null, imdbRating: undefined };
    render(<TitleCard item={bare} />);
    expect(screen.getByText("The Cold Blue")).toBeDefined();
    expect(screen.queryByText(/Dir\./)).toBeNull();
    expect(screen.queryByText(/★/)).toBeNull();
    expect(screen.queryByText(/thesis/i)).toBeNull();
  });
});

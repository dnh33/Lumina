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

describe("TitleCard provenance", () => {
  it("renders the provenance line when provided", () => {
    render(<TitleCard item={item} provenance="Pushes back on Arrival" />);
    expect(screen.getByText("Pushes back on Arrival")).toBeDefined();
  });

  it("omits the provenance line when absent", () => {
    render(<TitleCard item={item} />);
    expect(screen.queryByText(/Pushes back on/)).toBeNull();
  });
});

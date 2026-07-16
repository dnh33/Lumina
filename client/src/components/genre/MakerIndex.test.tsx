import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GenreModules } from "./GenreModules.js";
import type { CatalogItem } from "../../lib/types.js";

const qc = new QueryClient();

const renderMods = (
  modules: any,
  items: CatalogItem[],
  makers?: Record<number, any>,
) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GenreModules modules={modules} items={items} makers={makers} />
      </MemoryRouter>
    </QueryClientProvider>,
  );


const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1995, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 2, mediaType: "movie", title: "Mid", year: 2005, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
];

describe("MakerIndex (D6)", () => {
  it("surfaces a recurring director index when 2+ titles share a director", () => {
    const makers = {
      1: { director: "Jane Doe", directorId: 42, title: "Old Film" },
      2: { director: "Jane Doe", directorId: 42, title: "Mid" },
      3: { director: "Sam Roe", directorId: 7, title: "Modern One" },
    };
    renderMods(["maker"], items, makers);
    const idx = screen.getByLabelText(/Director index/i);
    expect(idx).toBeDefined();
    // Jane Doe appears on 2 titles -> rendered with her count
    const chip = within(idx).getByTestId("director-index-chip");
    expect(chip.textContent).toContain("Jane Doe");
    expect(chip.textContent).toContain("2 titles");
  });

  it("renders one chip per recurring director", () => {
    const makers = {
      1: { director: "Jane Doe", directorId: 42, title: "Old Film" },
      2: { director: "Jane Doe", directorId: 42, title: "Mid" },
      3: { director: "Sam Roe", directorId: 7, title: "Modern One" },
      4: { director: "Sam Roe", directorId: 7, title: "Sequel" },
    };
    const extra: CatalogItem[] = [
      { tmdbId: 4, mediaType: "movie", title: "Sequel", year: 2020, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 5, inLibrary: false },
    ];
    renderMods(["maker"], [...items, ...extra], makers);
    const chips = screen.getAllByTestId("director-index-chip");
    expect(chips.length).toBe(2);
  });

  it("does NOT render the director index when no director recurs", () => {
    const makers = {
      1: { director: "Jane Doe", directorId: 42, title: "Old Film" },
      2: { director: "Sam Roe", directorId: 7, title: "Mid" },
      3: { director: "Lee Poe", directorId: 9, title: "Modern One" },
    };
    renderMods([], items, makers);
    expect(screen.queryByLabelText(/Director index/i)).toBeNull();
  });

  it("does NOT render the director index when makers is absent", () => {
    renderMods([], items);
    expect(screen.queryByLabelText(/Director index/i)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GenreModules } from "./GenreModules.js";
import { getGenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem } from "../../lib/types.js";

const qc = new QueryClient();
const renderMods = (
  modules: any,
  items: CatalogItem[],
  args?: Record<number, any>,
  makers?: Record<number, any>,
  world?: any,
) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GenreModules modules={modules} items={items} arguments={args} makers={makers} world={world} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const argItem: CatalogItem = {
  tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "",
  posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99],
  popularity: 1, inLibrary: false, imdbRating: 8.2,
};

describe("GenreModules metaphor grammar (Task 4.1)", () => {
  it("renders a ConstellationBackdrop when world.metaphor === 'Constellation'", () => {
    const world = getGenreWorld("science-fiction"); // Constellation
    const args: Record<number, any> = { 1: { thesis: "Wonder is scalable", counterpoint: null } };
    const makers: Record<number, any> = { 1: { director: "Jane Doe", directorId: 42, title: "Doc A" } };
    const { getByTestId } = renderMods(["argument"], [argItem], args, makers, world);
    expect(getByTestId("constellation-backdrop")).toBeDefined();
    // Frontier backdrop must NOT appear for a Constellation world
    expect(screen.queryByTestId("frontier-spine")).toBeNull();
  });

  it("renders a FrontierSpine when world.metaphor === 'Frontier'", () => {
    const world = getGenreWorld("western"); // Frontier
    const { getByTestId } = renderMods(["argument"], [argItem], {}, {}, world);
    expect(getByTestId("frontier-spine")).toBeDefined();
    expect(screen.queryByTestId("constellation-backdrop")).toBeNull();
  });

  it("renders NO backdrop for non-flagship metaphors (e.g. Panel)", () => {
    const world = getGenreWorld("anime"); // Panel
    renderMods(["argument"], [argItem], {}, {}, world);
    expect(screen.queryByTestId("constellation-backdrop")).toBeNull();
    expect(screen.queryByTestId("frontier-spine")).toBeNull();
  });

  it("passes the themed cardVariant to TitleCard for argument worlds (constellation ring class)", () => {
    const world = getGenreWorld("science-fiction"); // cardVariant "constellation"
    const args: Record<number, any> = { 1: { thesis: "Wonder is scalable", counterpoint: null } };
    const makers: Record<number, any> = { 1: { director: "Jane Doe", directorId: 42, title: "Doc A" } };
    const { container } = renderMods(["argument"], [argItem], args, makers, world);
    // TitleCard root gets the constellation variant ring class
    const titleCard = container.querySelector('section[aria-label="Doc A summary"]');
    expect(titleCard).toBeDefined();
    expect(titleCard!.className).toContain("ring-[var(--world-accent)]/20");
  });

  it("passes the frontier border-left variant class to TitleCard for Frontier worlds", () => {
    const world = getGenreWorld("western"); // cardVariant "frontier"
    const args: Record<number, any> = { 1: { thesis: "Restless expanse", counterpoint: null } };
    const makers: Record<number, any> = { 1: { director: "Jane Doe", directorId: 42, title: "Doc A" } };
    const { container } = renderMods(["argument"], [argItem], args, makers, world);
    const titleCard = container.querySelector('section[aria-label="Doc A summary"]');
    expect(titleCard).toBeDefined();
    expect(titleCard!.className).toContain("border-l-2");
  });

  it("falls back to no variant class when world is undefined", () => {
    const args: Record<number, any> = { 1: { thesis: "X", counterpoint: null } };
    const { container } = renderMods(["argument"], [argItem], args, {}, undefined);
    const titleCard = container.querySelector('section[aria-label="Doc A summary"]');
    expect(titleCard).toBeDefined();
    expect(titleCard!.className).not.toContain("ring-[var(--world-accent)]/20");
    expect(titleCard!.className).not.toContain("border-l-2");
    expect(screen.queryByTestId("constellation-backdrop")).toBeNull();
  });
});

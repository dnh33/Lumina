import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GenreModules } from "./GenreModules.js";
import type { CatalogItem } from "../../lib/types.js";

const qc = new QueryClient();
const renderMods = (
  modules: any,
  items: CatalogItem[],
  credibility?: Record<number, any>,
  watchOrder?: Record<number, any>,
) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GenreModules modules={modules} items={items} credibility={credibility} watchOrder={watchOrder} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const items: CatalogItem[] = [
  { tmdbId: 1, mediaType: "movie", title: "Old Film", year: 1995, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 2, mediaType: "movie", title: "Mid", year: 2005, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
  { tmdbId: 3, mediaType: "movie", title: "Modern One", year: 2017, overview: "", posterPath: null, backdropPath: null, voteAverage: 7.5, genreIds: [99], popularity: 10, inLibrary: false },
];

describe("GenreModules", () => {
  it("renders the Timeline scrubber when 'timeline' is in modules", () => {
    renderMods(["timeline"], items);
    expect(screen.getByText(/1990s/)).toBeDefined();
  });

  it("renders TopicCluster when 'topic' is in modules, grouping items by genre", () => {
    const topicItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 2, mediaType: "movie", title: "Doc B", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 3, mediaType: "movie", title: "Sci C", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [878], popularity: 1, inLibrary: false },
    ];
    renderMods(["topic"], topicItems);
    // two genre spines (99 and 878) -> two topic headings
    expect(screen.getAllByText(/Genre \d+/).length).toBe(2);
    expect(screen.getAllByText("Doc A").length).toBeGreaterThan(0);
  });

  it("renders CredibilityStrip per title when 'critic' module + credibility map present", () => {
    const credItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
    ];
    const credibility: Record<number, any> = { 1: { distributor: "Netflix", streaming: true, consensus: "RT 94%", stance: "advocacy" } };
    renderMods(["critic"], credItems, credibility);
    expect(screen.getByText(/Distributor: Netflix/)).toBeDefined();
    expect(screen.getByText(/RT 94%/)).toBeDefined();
    expect(screen.getByText(/Stance: advocacy/)).toBeDefined();
  });

  it("renders WatchOrderSequencer when 'watchorder' module + data present", () => {
    const woItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "tv", title: "Doc Series", year: 2018, overview: "", posterPath: null, backdropPath: null, voteAverage: 8, genreIds: [99], popularity: 1, inLibrary: false },
    ];
    const watchOrder: Record<number, any> = {
      1: { seasons: [{ number: 1, name: "Season 1", episodeCount: 6, watched: true }, { number: 2, name: "Season 2", episodeCount: 4, watched: false }], recommendedStart: 2 },
    };
    renderMods(["watchorder"], woItems, undefined, watchOrder);
    expect(screen.getByText(/Watch order/)).toBeDefined();
    expect(screen.getByText(/Start here/)).toBeDefined();
    expect(screen.getByText("Season 1")).toBeDefined();
  });
  it("renders nothing extra when modules is empty", () => {
    const { container } = renderMods([], items);
    expect(container.firstChild).toBeNull();
  });
});

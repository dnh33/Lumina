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
  args?: Record<number, any>,
  geo?: Record<number, any>,
  makers?: Record<number, any>,
) =>
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <GenreModules modules={modules} items={items} credibility={credibility} watchOrder={watchOrder} arguments={args} geo={geo} makers={makers} />
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
    // two genre spines (99 -> Documentary, 878 -> Science Fiction) -> two real topic headings
    expect(screen.getAllByText("Documentary").length).toBe(1);
    expect(screen.getAllByText("Science Fiction").length).toBe(1);
    expect(screen.getAllByText("Doc A").length).toBeGreaterThan(0);
  });

  it("labels topic spines with the real genre name, not 'Genre <id>'", () => {
    const topicItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 3, mediaType: "movie", title: "Sci C", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [878], popularity: 1, inLibrary: false },
    ];
    renderMods(["topic"], topicItems);
    // no synthetic "Genre 99" / "Genre 878" labels should be rendered
    expect(screen.queryByText(/^Genre \d+$/)).toBeNull();
    expect(screen.getByText("Documentary")).toBeDefined();
    expect(screen.getByText("Science Fiction")).toBeDefined();
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

  it("renders ArgumentPanel when 'argument' module + data present", () => {
    const argItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false, imdbRating: 8.2 },
    ];
    const args: Record<number, any> = {
      1: { thesis: "Climate change is solvable", counterpoint: { title: "Skeptic", relation: "disagrees on cause" } },
    };
    const makers: Record<number, any> = { 1: { director: "Jane Doe", directorId: 42, title: "Doc A" } };
    renderMods(["argument"], argItems, undefined, undefined, args, undefined, makers);
    expect(screen.getByText(/The argument/)).toBeDefined();
    expect(screen.getAllByText(/Climate change is solvable/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Counterpoint/)).toBeDefined();
    // composed TitleCard renders per-item with director + rating enrichment
    expect(screen.getByText(/Dir\. Jane Doe/)).toBeDefined();
    expect(screen.getByText(/★ 8\.2/)).toBeDefined();
    // composed TitleCard shows a "why this belongs here" provenance line
    expect(screen.getByText(/Pushes back on Skeptic/)).toBeDefined();
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
  it("renders GeoMap when 'geo' module + data present", () => {
    const geoItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
    ];
    const geo: Record<number, any> = {
      1: [
        { code: "US", name: "USA", count: 3 },
        { code: "GB", name: "UK", count: 1 },
      ],
    };
    renderMods(["geo"], geoItems, undefined, undefined, undefined, geo);
    expect(screen.getByText(/Where it/)).toBeDefined();
    expect(screen.getByText("USA")).toBeDefined();
    expect(screen.getByText("UK")).toBeDefined();
  });
  it("renders MakerSpotlight when 'maker' module + director present", () => {
    const mkItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
    ];
    const makers: Record<number, any> = { 1: { director: "Jane Doe", directorId: 42, title: "Doc A" } };
    renderMods(["maker"], mkItems, undefined, undefined, undefined, undefined, makers);
    expect(screen.getByText(/Maker/i)).toBeDefined();
    expect(screen.getByText("Jane Doe")).toBeDefined();
  });
  it("renders nothing extra when modules is empty", () => {
    const { container } = renderMods([], items);
    expect(container.firstChild).toBeNull();
  });
});

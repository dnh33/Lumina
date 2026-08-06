import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GenreModules } from "./GenreModules.js";
import { libraryWatchlistPath } from "./tonightBag.js";
import type { CatalogItem } from "../../lib/types.js";

vi.mock("../../lib/api.js", () => ({
  api: {
    addToLibrary: vi.fn(),
  },
}));

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
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

  it("claim stage parks Featured chrome — Argument only (roast2 P0)", () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules
            modules={["timeline", "topic", "argument"]}
            items={items}
            arguments={{
              1: { thesis: "Claim lead.", counterpoint: null },
            }}
            stage="claim"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId("timeline-tray")).toBeNull();
    expect(document.getElementById("timeline-rail")).toBeNull();
    expect(screen.queryByText(/Also tagged/)).toBeNull();
    expect(screen.queryByTestId("featured-thesis")).toBeNull();
    expect(screen.queryByText("Featured")).toBeNull();
    expect(screen.getByTestId("claim-argue-park")).toBeDefined();
    expect(screen.getByText(/Claim lead/)).toBeDefined();
  });

  it("claim stage parks Maker (D2 / roast2 P0)", () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules
            modules={["maker", "argument"]}
            items={items}
            arguments={{
              1: { thesis: "Claim lead.", counterpoint: null },
            }}
            makers={{ 1: { director: "Jane Doe", directorId: 42, title: "Old Film" } }}
            stage="claim"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId("featured-thesis")).toBeNull();
    expect(screen.getByTestId("claim-argue-park")).toBeDefined();
    expect(screen.queryByRole("region", { name: /Maker/i })).toBeNull();
    expect(screen.queryByText("Jane Doe")).toBeNull();
  });

  it("browse stage mounts timeline for Widen tray only", () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules modules={["timeline", "topic"]} items={items} stage="browse" />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("timeline-tray")).toBeDefined();
  });

  it("renders TopicCluster when 'topic' is in modules, grouping items by genre", () => {
    const topicItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 2, mediaType: "movie", title: "Doc B", year: 2012, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 3, mediaType: "movie", title: "Sci C", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [878], popularity: 1, inLibrary: false },
    ];
    renderMods(["topic"], topicItems);
    expect(screen.getByText(/Also tagged/)).toBeDefined();
    expect(screen.getByText(/Documentary \(2\)/)).toBeDefined();
    expect(screen.getByText(/Science Fiction \(1\)/)).toBeDefined();
    expect(screen.getAllByText("Doc A").length).toBeGreaterThan(0);
  });

  it("labels topic spines with the real genre name, not 'Genre <id>'", () => {
    const topicItems: CatalogItem[] = [
      { tmdbId: 1, mediaType: "movie", title: "Doc A", year: 2010, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [99], popularity: 1, inLibrary: false },
      { tmdbId: 3, mediaType: "movie", title: "Sci C", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 7, genreIds: [878], popularity: 1, inLibrary: false },
    ];
    renderMods(["topic"], topicItems);
    expect(screen.queryByText(/^Genre \d+$/)).toBeNull();
    expect(screen.getByText(/Documentary \(1\)/)).toBeDefined();
    expect(screen.getByText(/Science Fiction \(1\)/)).toBeDefined();
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
    // The counterpoint renders as a relation-labeled comparison row.
    expect(screen.getByText(/Disagrees on cause/)).toBeDefined();
    // composed TitleCard renders per-item with director + rating enrichment
    expect(screen.getByText(/Dir\. Jane Doe/)).toBeDefined();
    expect(screen.getByText(/★ 8\.2/)).toBeDefined();
    // composed TitleCard shows a "why this belongs here" provenance line
    expect(screen.getByText(/Pushes back on Skeptic/)).toBeDefined();
  });

  it("omits director tautology provenance when there is no counterpoint", () => {
    const argItems: CatalogItem[] = [
      {
        tmdbId: 1,
        mediaType: "movie",
        title: "Doc A",
        year: 2010,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 7,
        genreIds: [99],
        popularity: 1,
        inLibrary: false,
        imdbRating: 8.2,
      },
    ];
    const args: Record<number, any> = {
      1: { thesis: "A clear thesis.", counterpoint: null },
    };
    const makers: Record<number, any> = {
      1: { director: "Jane Doe", directorId: 42, title: "Doc A" },
    };
    renderMods(["argument"], argItems, undefined, undefined, args, undefined, makers);
    expect(screen.queryByText(/From the team behind/)).toBeNull();
    expect(screen.getByText(/^2010$/)).toBeDefined();
  });

  it("Self full co-locates tray and Featured in browse-inspect", () => {
    const args: Record<number, any> = {
      1: { thesis: "Shelf thesis.", counterpoint: null },
    };
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules
            modules={["timeline", "argument"]}
            items={items}
            arguments={args}
            stage="full"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const instrument = screen.getByTestId("browse-inspect");
    expect(instrument.querySelector('[data-testid="timeline-tray"]')).not.toBeNull();
    expect(instrument.querySelector('[data-testid="featured-thesis"]')).not.toBeNull();
  });

  it("claim stage does not wrap Featured in browse-inspect", () => {
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules
            modules={["timeline", "argument"]}
            items={items}
            arguments={{
              1: { thesis: "Claim lead.", counterpoint: null },
            }}
            stage="claim"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId("browse-inspect")).toBeNull();
    expect(screen.queryByTestId("featured-thesis")).toBeNull();
    expect(screen.getByTestId("claim-argue-park")).toBeDefined();
  });

  it("places Featured before Also tagged in the DOM", () => {
    const mixed: CatalogItem[] = [
      {
        tmdbId: 1,
        mediaType: "movie",
        title: "Doc A",
        year: 2010,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 7,
        genreIds: [99],
        popularity: 1,
        inLibrary: false,
      },
      {
        tmdbId: 3,
        mediaType: "movie",
        title: "Sci C",
        year: 2015,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 7,
        genreIds: [878],
        popularity: 1,
        inLibrary: false,
      },
    ];
    const args: Record<number, any> = {
      1: { thesis: "Why Doc A.", counterpoint: null },
    };
    const { container } = renderMods(
      ["timeline", "topic", "argument"],
      mixed,
      undefined,
      undefined,
      args,
    );
    const html = container.innerHTML;
    const featuredAt = html.indexOf('data-testid="featured-thesis"');
    const alsoAt = html.indexOf("Also tagged");
    expect(featuredAt).toBeGreaterThan(-1);
    expect(alsoAt).toBeGreaterThan(-1);
    expect(featuredAt).toBeLessThan(alsoAt);
  });

  it("Guided Featured follows rail order, not highest rating", () => {
    const ranked: CatalogItem[] = [
      {
        tmdbId: 10,
        mediaType: "movie",
        title: "Blackfish",
        year: 2013,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 7.2,
        genreIds: [99],
        popularity: 20,
        inLibrary: false,
      },
      {
        tmdbId: 99,
        mediaType: "movie",
        title: "One Direction: This Is Us",
        year: 2013,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 9.1,
        genreIds: [99],
        popularity: 5,
        inLibrary: false,
      },
    ];
    const args: Record<number, any> = {
      10: { thesis: "Guided lead thesis.", counterpoint: null },
      99: { thesis: "High-rated Self pick.", counterpoint: null },
    };
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <GenreModules
            modules={["argument"]}
            items={ranked}
            arguments={args}
            preferGuidedFeatured
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const featured = screen.getByTestId("featured-thesis");
    expect(featured.textContent).toMatch(/Blackfish/);
    expect(featured.textContent).toMatch(/Guided lead thesis/);
    expect(featured.textContent).not.toMatch(/One Direction/);
    expect(featured.textContent).toMatch(/One title from this shelf/);
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

  describe("Self Featured Watchlist/Pass (T8 / W2.3)", () => {
    beforeEach(async () => {
      const { api } = await import("../../lib/api.js");
      vi.mocked(api.addToLibrary).mockReset();
      vi.mocked(api.addToLibrary).mockResolvedValue({
        id: 1,
        tmdbId: 1,
        mediaType: "movie",
        status: "watchlist",
      } as any);
    });

    it("shows Watchlist/Pass only on Featured inspect (stage full)", () => {
      const args: Record<number, any> = {
        1: { thesis: "Shelf thesis.", counterpoint: null },
      };
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <GenreModules
              modules={["argument"]}
              items={items}
              arguments={args}
              stage="full"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(
        screen.getByRole("button", { name: /Add Old Film to watchlist/i }),
      ).toBeTruthy();
      expect(
        screen.getByRole("button", { name: /Pass on Old Film/i }),
      ).toBeTruthy();
      expect(screen.getByTestId("featured-claim-actions")).toBeTruthy();
    });

    it("claim stage does not show Self Watchlist chrome", () => {
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <GenreModules
              modules={["argument"]}
              items={items}
              arguments={{
                1: { thesis: "Claim lead.", counterpoint: null },
              }}
              stage="claim"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.queryByTestId("featured-claim-actions")).toBeNull();
      expect(
        screen.queryByRole("button", { name: /watchlist/i }),
      ).toBeNull();
    });

    it("Watchlist calls addToLibrary then shows In Library + Open in Library", async () => {
      const { api } = await import("../../lib/api.js");
      const args: Record<number, any> = {
        1: { thesis: "Shelf thesis.", counterpoint: null },
      };
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <GenreModules
              modules={["argument"]}
              items={items}
              arguments={args}
              stage="full"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /Add Old Film to watchlist/i }),
      );

      await waitFor(() => {
        expect(api.addToLibrary).toHaveBeenCalledWith({
          tmdbId: 1,
          mediaType: "movie",
          status: "watchlist",
        });
      });

      expect(screen.getByText(/^In Library$/)).toBeTruthy();
      const libLink = screen.getByRole("link", { name: /Open in Library/i });
      expect(libLink.getAttribute("href")).toBe(libraryWatchlistPath());
    });

    it("Pass advances Featured without calling addToLibrary", async () => {
      const { api } = await import("../../lib/api.js");
      const ranked: CatalogItem[] = [
        {
          ...items[0],
          tmdbId: 1,
          title: "Lead",
          voteAverage: 9,
        },
        {
          ...items[1],
          tmdbId: 2,
          title: "Next Up",
          voteAverage: 8,
        },
      ];
      const args: Record<number, any> = {
        1: { thesis: "Lead thesis.", counterpoint: null },
        2: { thesis: "Next thesis.", counterpoint: null },
      };
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <GenreModules
              modules={["argument"]}
              items={ranked}
              arguments={args}
              stage="full"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByTestId("featured-thesis").textContent).toMatch(/Lead/);
      fireEvent.click(screen.getByRole("button", { name: /Pass on Lead/i }));

      expect(api.addToLibrary).not.toHaveBeenCalled();
      expect(screen.getByTestId("featured-thesis").textContent).toMatch(
        /Next Up/,
      );
      expect(
        screen.getByRole("button", { name: /Add Next Up to watchlist/i }),
      ).toBeTruthy();
    });

    it("Pass keeps Featured when next pick has no hydrated thesis yet", async () => {
      const { api } = await import("../../lib/api.js");
      const ranked: CatalogItem[] = [
        {
          ...items[0],
          tmdbId: 1,
          title: "Lead",
          voteAverage: 9,
        },
        {
          ...items[1],
          tmdbId: 2,
          title: "Next Up",
          voteAverage: 8,
        },
      ];
      // Live GenreExperience only hydrates the current shelf lead — Pass must
      // not wipe inspect chrome when the successor has no lazy arg yet.
      const args: Record<number, { thesis: string; counterpoint: null }> = {
        1: { thesis: "Lead thesis.", counterpoint: null },
      };
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <GenreModules
              modules={["argument"]}
              items={ranked}
              arguments={args}
              stage="full"
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /Pass on Lead/i }));

      expect(api.addToLibrary).not.toHaveBeenCalled();
      expect(screen.getByTestId("featured-thesis").textContent).toMatch(
        /Next Up/,
      );
      expect(
        screen.getByRole("button", { name: /Add Next Up to watchlist/i }),
      ).toBeTruthy();
    });
  });
});

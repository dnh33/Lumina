import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { reducedRef } = vi.hoisted(() => ({ reducedRef: { current: false } }));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => reducedRef.current,
  };
});

import { ToolResultCard } from "./ToolResultCard";
import type { ToolNode } from "./buildToolNodes";

function makeCompareOutcome(candidates: any[]): string {
  return JSON.stringify({
    mood: "tonight",
    candidates: candidates.map((c) => ({
      tmdbId: c.tmdbId,
      title: c.title,
      year: c.year,
      tmdbRating: c.rating,
      poster_path: c.poster,
    })),
  });
}

function makeDetailsOutcome(details: any): string {
  return JSON.stringify({
    title: details.title,
    year: details.year,
    tagline: details.tagline,
    overview: details.overview,
    runtime: details.runtime,
    tmdbRating: details.rating,
    genres: details.genres || [],
    director: details.director,
    poster_path: details.poster,
    where_to_watch: details.whereToWatch || {},
  });
}

function makeSearchOutcome(results: any[]): string {
  return JSON.stringify({
    results: results.map((r) => ({
      id: r.id,
      title: r.title,
      poster_path: r.poster,
    })),
  });
}

describe("ToolResultCard", () => {
  describe("compare_titles", () => {
    it("renders side-by-side verdict cards for candidates", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: makeCompareOutcome([
          { tmdbId: 1, title: "Counterpart", year: 2017, rating: 8.5, poster: "/abc.jpg" },
          { tmdbId: 2, title: "Silo", year: 2023, rating: 8.2, poster: "/def.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      expect(screen.getByText("Counterpart")).toBeInTheDocument();
      expect(screen.getByText("Silo")).toBeInTheDocument();
      expect(screen.getByText("2017")).toBeInTheDocument();
      expect(screen.getByText("2023")).toBeInTheDocument();
      expect(screen.getByText("8.5")).toBeInTheDocument();
    });

    it("shows collapsed summary label by default", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: makeCompareOutcome([
          { tmdbId: 1, title: "Movie A", year: 2020, rating: 7.0, poster: "/a.jpg" },
          { tmdbId: 2, title: "Movie B", year: 2021, rating: 8.0, poster: "/b.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      // The summary label is always visible
      expect(screen.getByText("Side-by-side verdict")).toBeInTheDocument();
      // The details element wraps the card content (open by default in jsdom)
      const details = screen.getByText("Side-by-side verdict").closest("details");
      expect(details).toBeInTheDocument();
      // Posters are in the DOM (details content)
      expect(screen.getByAltText("Movie A")).toBeInTheDocument();
      expect(screen.getByAltText("Movie B")).toBeInTheDocument();
    });

    it("expands to show details on click", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: makeCompareOutcome([
          { tmdbId: 1, title: "Movie A", year: 2020, rating: 7.0, poster: "/a.jpg" },
          { tmdbId: 2, title: "Movie B", year: 2021, rating: 8.0, poster: "/b.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      fireEvent.click(screen.getByText("Side-by-side verdict"));
      expect(screen.getByText("Movie A")).toBeInTheDocument();
      expect(screen.getByText("Movie B")).toBeInTheDocument();
    });

    it("renders fallback poster when poster_path is a remote URL", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: makeCompareOutcome([
          { tmdbId: 1, title: "Movie A", year: 2020, rating: 7.0, poster: "https://example.com/poster.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      const img = screen.getByAltText("Movie A") as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toBe("https://example.com/poster.jpg");
    });

    it("reconstructs poster URL from TMDB path", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: makeCompareOutcome([
          { tmdbId: 1, title: "Movie A", year: 2020, rating: 7.0, poster: "/abc123.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      const img = screen.getByAltText("Movie A") as HTMLImageElement;
      expect(img.src).toBe("https://image.tmdb.org/t/p/w342/abc123.jpg");
    });
  });

  describe("get_title_details", () => {
    it("renders poster + metadata grid + where-to-watch", () => {
      const node: ToolNode = {
        name: "get_title_details",
        done: true,
        outcome: makeDetailsOutcome({
          title: "Arrival",
          year: 2016,
          tagline: "Classify the unknown",
          overview: "A linguist is recruited...",
          runtime: 116,
          rating: 8.0,
          genres: [{ name: "Science Fiction" }, { name: "Drama" }],
          director: "Denis Villeneuve",
          poster: "/arrival.jpg",
          whereToWatch: { Netflix: "US", Prime: "US" },
        }),
      };
      render(<ToolResultCard node={node} />);

      expect(screen.getByText("Arrival")).toBeInTheDocument();
      expect(screen.getAllByText("2016")[0]).toBeInTheDocument();
      expect(screen.getByText("116 min")).toBeInTheDocument();
      expect(screen.getByText(/Denis Villeneuve/)).toBeInTheDocument();
      expect(screen.getByText(/Science Fiction/)).toBeInTheDocument();
      expect(screen.getByText(/Drama/)).toBeInTheDocument();
    });
  });

  describe("search_tmdb", () => {
    it("renders a grid of result thumbnails", () => {
      const node: ToolNode = {
        name: "search_tmdb",
        done: true,
        outcome: makeSearchOutcome([
          { id: 1, title: "Movie A", poster: "/a.jpg" },
          { id: 2, title: "Movie B", poster: "/b.jpg" },
          { id: 3, title: "Movie C", poster: "/c.jpg" },
        ]),
      };
      render(<ToolResultCard node={node} />);

      // Titles are in alt text of images
      expect(screen.getByAltText("Movie A")).toBeInTheDocument();
      expect(screen.getByAltText("Movie B")).toBeInTheDocument();
      expect(screen.getByAltText("Movie C")).toBeInTheDocument();
      expect(screen.getByText("Results grid")).toBeInTheDocument();
    });

    it("renders fallback text when no results", () => {
      const node: ToolNode = {
        name: "search_tmdb",
        done: true,
        outcome: JSON.stringify({ results: [] }),
      };
      render(<ToolResultCard node={node} />);
      expect(screen.getByText("No results found.")).toBeInTheDocument();
    });
  });

  describe("unknown tools", () => {
    it("returns null for tools without rich results", () => {
      const node: ToolNode = {
        name: "add_to_library",
        done: true,
        outcome: "Saved to your library.",
      };
      const { container } = render(<ToolResultCard node={node} />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null for malformed JSON outcome", () => {
      const node: ToolNode = {
        name: "compare_titles",
        done: true,
        outcome: "not valid json",
      };
      const { container } = render(<ToolResultCard node={node} />);
      expect(container.firstChild).toBeNull();
    });
  });
});

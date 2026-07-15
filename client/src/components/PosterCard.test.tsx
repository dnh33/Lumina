import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PosterCard } from "./PosterCard.js";
import type { CatalogItem } from "../lib/types.js";

const item: CatalogItem = {
  tmdbId: 123,
  mediaType: "movie",
  title: "The Linked Film",
  year: 2012,
  overview: "",
  posterPath: null,
  backdropPath: null,
  voteAverage: 7.5,
  genreIds: [],
  popularity: 5,
};

// PosterCard performs live queries (anchor retired state) only when libraryId
// is passed; for the link assertion we render without it so nothing hits the
// network. Wrap in providers: PosterCard calls useQueryClient() and renders a
// react-router <Link>, both of which need context.
vi.mock("../lib/api.js", () => ({
  api: { anchorRetired: vi.fn() },
}));

function renderCard(node: React.ReactNode) {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PosterCard link to title (K2)", () => {
  it("renders an anchor to /title/:mediaType/:tmdbId wrapping the card", () => {
    renderCard(<PosterCard item={item} />);
    const link = screen.getByRole("link", { name: item.title });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/title/movie/123");
  });

  it("links different media types correctly (tv)", () => {
    renderCard(<PosterCard item={{ ...item, mediaType: "tv", tmdbId: 77 }} />);
    const link = screen.getByRole("link", { name: item.title });
    expect(link.getAttribute("href")).toBe("/title/tv/77");
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PosterCard } from "../PosterCard.js";
import type { CatalogItem } from "../../lib/types.js";

const baseItem: CatalogItem = {
  tmdbId: 123,
  mediaType: "movie",
  title: "The Quiet Library",
  year: 2012,
  overview: "",
  posterPath: null,
  backdropPath: null,
  voteAverage: 7.5,
  genreIds: [],
  popularity: 5,
};

// PosterCard only fires live queries when libraryId is passed; render without
// it so nothing touches the network. It also needs a router <Link> context and
// a react-query client. The lit indicator reads --world-accent from the page
// root, so we set it on the wrapping div to mimic the GenreExperience root.
vi.mock("../../lib/api.js", () => ({
  api: { anchorRetired: vi.fn() },
}));

function renderCard(node: React.ReactNode) {
  const qc = new QueryClient();
  return render(
    <div style={{ ["--world-accent" as any]: "#e9b84b" }}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>{node}</MemoryRouter>
      </QueryClientProvider>
    </div>,
  );
}

describe("PosterCard density-as-place (B8)", () => {
  it("renders a lit indicator when item.inLibrary", () => {
    renderCard(<PosterCard item={{ ...baseItem, inLibrary: true }} />);
    const lit = document.querySelector('[data-density="lit"]');
    expect(lit).not.toBeNull();
    expect(lit!.getAttribute("aria-label")).toBe("In your library");
  });

  it("applies the dimmed treatment when item.ignored", () => {
    renderCard(<PosterCard item={{ ...baseItem, ignored: true }} />);
    const root = document.querySelector(".density-dimmed");
    expect(root).not.toBeNull();
    // no lit indicator when only ignored
    expect(document.querySelector('[data-density="lit"]')).toBeNull();
  });

  it("renders neither treatment by default", () => {
    renderCard(<PosterCard item={baseItem} />);
    expect(document.querySelector('[data-density="lit"]')).toBeNull();
    expect(document.querySelector(".density-dimmed")).toBeNull();
  });
});

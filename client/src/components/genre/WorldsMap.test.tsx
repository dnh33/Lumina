import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import { GENRE_WORLDS } from "../../lib/genreWorld.js";

vi.mock("../../lib/api.js", () => ({
  api: {
    library: vi.fn(async () => [
      {
        mediaType: "movie",
        tmdbId: 1,
        title: "Hereditary",
        genres: ["Horror"],
      },
      {
        mediaType: "movie",
        tmdbId: 2,
        title: "The Thing",
        genres: ["Horror", "Science Fiction"],
      },
      {
        mediaType: "movie",
        tmdbId: 3,
        title: "Alien",
        genres: ["Horror", "Science Fiction"],
      },
      {
        mediaType: "movie",
        tmdbId: 4,
        title: "Midsommar",
        genres: ["Horror"],
      },
      {
        mediaType: "movie",
        tmdbId: 5,
        title: "The Witch",
        genres: ["Horror"],
      },
      {
        mediaType: "movie",
        tmdbId: 6,
        title: "It Follows",
        genres: ["Horror"],
      },
      {
        mediaType: "movie",
        tmdbId: 7,
        title: "Raw",
        genres: ["Horror"],
      },
    ]),
  },
}));

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

import { WorldsMap } from "./WorldsMap";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

const ATLAS_SLUGS = Object.keys(GENRE_WORLDS).filter((s) => s !== "sci-fi");

function renderMap(
  props: {
    currentSlug?: string;
    defaultFocus?: string;
    variant?: "standalone" | "hub";
    embedded?: boolean;
    guidedResumeBySlug?: Record<string, boolean>;
  } = {},
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <WorldsMap {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WorldsMap — territory atlas", () => {
  beforeEach(() => {
    vi.mocked(api.library).mockClear();
    navigate.mockClear();
  });

  it("renders one cell per curated world, excluding sci-fi alias", async () => {
    renderMap();
    for (const slug of ATLAS_SLUGS) {
      expect(await screen.findByTestId(`node-${slug}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId("node-sci-fi")).not.toBeInTheDocument();
  });

  it("links each world marker to /genre/:slug (one-click enter)", async () => {
    renderMap();
    const anime = await screen.findByTestId("node-anime");
    expect(anime.closest("a") ?? anime).toHaveAttribute(
      "href",
      "/genre/anime?mode=self",
    );
  });

  it("exposes ≥44px touch hit pads on markers (hub map height)", async () => {
    renderMap({ variant: "hub" });
    const horror = await screen.findByTestId("node-horror");
    expect(horror).toHaveAttribute("data-hit-r", "30");
    const hit = screen.getByTestId("node-hit-horror");
    expect(hit).toHaveAttribute("r", "30");
  });

  it("shows dense shelf status for a world with ≥6 shelf titles", async () => {
    renderMap();
    await waitFor(() => {
      const horror = screen.getByTestId("node-horror");
      expect(horror).toHaveAttribute(
        "aria-label",
        expect.stringMatching(/dense shelf/i),
      );
    });
  });

  it("announces cold shelves as No shelf · catalog live, not Empty", async () => {
    renderMap({ variant: "hub", defaultFocus: "film-noir" });
    const noir = await screen.findByTestId("node-film-noir");
    expect(noir).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/no shelf/i),
    );
    expect(noir).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/catalog live/i),
    );
    expect(noir.getAttribute("aria-label")).not.toMatch(/\bEmpty\b/);
    expect(noir.getAttribute("aria-label")).not.toMatch(/Unseeded/i);

    await waitFor(() => {
      expect(screen.getByTestId("chart-focus")).toBeInTheDocument();
    });
    const focus = screen.getByTestId("chart-focus");
    expect(focus.textContent).toMatch(/No shelf/i);
    expect(focus.textContent).toMatch(/catalog live/i);
    expect(focus.textContent).not.toMatch(/\bEmpty\b/);
    expect(focus.textContent).not.toMatch(/Unseeded/i);
  });

  it("reveals neighbor warps when a world is focused", async () => {
    renderMap();
    const horror = await screen.findByTestId("node-horror");
    fireEvent.mouseEnter(horror);
    await waitFor(() => {
      expect(screen.getByTestId("chart-focus")).toBeInTheDocument();
    });
    expect(screen.getByTestId("warp-thriller")).toHaveAttribute(
      "href",
      "/genre/thriller?mode=self",
    );
    expect(screen.getByTestId("warp-film-noir")).toHaveAttribute(
      "href",
      "/genre/film-noir?mode=self",
    );
  });

  it("exposes Enter CTA for the focused world", async () => {
    renderMap();
    const documentary = await screen.findByTestId("node-documentary");
    fireEvent.focus(documentary);
    expect(await screen.findByTestId("enter-documentary")).toHaveAttribute(
      "href",
      "/genre/documentary?mode=self",
    );
  });

  it("shows mist Resume tour on focus strip when Guided progress exists", async () => {
    renderMap({
      variant: "hub",
      defaultFocus: "horror",
      guidedResumeBySlug: { horror: true },
    });
    const resume = await screen.findByTestId("resume-tour-horror");
    expect(resume).toHaveAttribute("href", "/genre/horror?mode=guided");
    expect(resume).toHaveTextContent("Resume tour");
    expect(screen.getByTestId("enter-horror")).toHaveAttribute(
      "href",
      "/genre/horror?mode=self",
    );
  });

  it("hides Resume tour when Guided progress is absent", async () => {
    renderMap({
      variant: "hub",
      defaultFocus: "horror",
      guidedResumeBySlug: { horror: false },
    });
    await screen.findByTestId("enter-horror");
    expect(screen.queryByTestId("resume-tour-horror")).not.toBeInTheDocument();
  });

  it("is announced as a map with a shelf status legend and atlas surface", async () => {
    renderMap();
    expect(
      await screen.findByRole("heading", { name: /^map$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: /shelf status legend/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("map-atlas")).toBeInTheDocument();
  });

  it("exposes world markers as keyboard links (no role=img trap)", async () => {
    renderMap({ variant: "hub", defaultFocus: "horror" });
    const atlas = await screen.findByTestId("map-atlas");
    expect(atlas).toHaveAttribute("role", "group");
    expect(atlas.querySelector("svg[role='img']")).toBeNull();

    const horror = await screen.findByTestId("node-horror");
    expect(horror.tabIndex).toBe(0);
    expect(horror).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/horror world/i),
    );
    // Markers must be discoverable as links for AT + Tab order
    expect(
      screen.getByRole("link", { name: /^Horror world -/i }),
    ).toBe(horror);

    expect(
      screen.getByRole("link", { name: /^Enter Horror world$/i }),
    ).toHaveAttribute("href", "/genre/horror?mode=self");
    expect(
      screen.getByRole("link", { name: /^Warp to Thriller world$/i }),
    ).toHaveAttribute("href", "/genre/thriller?mode=self");
  });

  it("Enter and Space on a focused marker navigate to that world", async () => {
    renderMap({ variant: "hub", defaultFocus: "horror" });
    const anime = await screen.findByTestId("node-anime");
    fireEvent.focus(anime);
    const ring = anime.querySelector(".marker-focus-ring");
    expect(ring).toHaveAttribute("opacity", "1");
    fireEvent.keyDown(anime, { key: "Enter" });
    expect(navigate).toHaveBeenCalledWith("/genre/anime?mode=self");
    navigate.mockClear();
    fireEvent.keyDown(anime, { key: " " });
    expect(navigate).toHaveBeenCalledWith("/genre/anime?mode=self");
  });

  it("hub variant drops peer heading and duplicate legend", async () => {
    renderMap({ variant: "hub", defaultFocus: "horror" });
    expect(screen.queryByRole("heading", { name: /^map$/i })).toBeNull();
    expect(screen.queryByRole("list", { name: /shelf status legend/i })).toBeNull();
    expect(screen.getByTestId("worlds-map")).toHaveAttribute("data-variant", "hub");
    expect(await screen.findByTestId("enter-horror")).toHaveAttribute(
      "href",
      "/genre/horror?mode=self",
    );
  });

  it("marks the current world when currentSlug is set", async () => {
    renderMap({ currentSlug: "horror" });
    const horror = await screen.findByTestId("node-horror");
    expect(horror).toHaveAttribute("aria-current", "page");
  });
});

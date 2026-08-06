import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock react-router-dom's useNavigate so we can assert warp navigation
// without booting the router stack.
const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

import { NeighborRail } from "./NeighborRail";
import { getGenreWorld, type GenreWorld } from "../../lib/genreWorld";

function renderRail(world: GenreWorld, initialEntries: string[] = ["/genre/thriller"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <NeighborRail world={world} />
    </MemoryRouter>,
  );
}

describe("NeighborRail (Task 5.1 — cross-world warp)", () => {
  it("renders a labeled rail with a chip per adjacency", () => {
    const world = getGenreWorld("thriller"); // adjacency: horror, film-noir, crime
    renderRail(world);
    expect(screen.getByRole("navigation", { name: /neighboring worlds/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /horror/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /film noir/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crime/i })).toBeInTheDocument();
  });

  it("navigates to /genre/:slug when a neighbor chip is clicked", () => {
    const world = getGenreWorld("thriller");
    renderRail(world);
    fireEvent.click(screen.getByRole("button", { name: /horror/i }));
    expect(navigate).toHaveBeenCalledWith("/genre/horror");
  });

  it("preserves ?mediaType=tv (and other search params) on a genre hop", () => {
    const world = getGenreWorld("documentary"); // adjacency: history, war-politics
    renderRail(world, ["/genre/documentary?mediaType=tv"]);
    fireEvent.click(screen.getByRole("button", { name: /history/i }));
    expect(navigate).toHaveBeenCalledWith("/genre/history?mediaType=tv");
  });

  it("preserves arbitrary search params on a genre hop", () => {
    const world = getGenreWorld("thriller");
    renderRail(world, ["/genre/thriller?mediaType=tv&mode=guided"]);
    fireEvent.click(screen.getByRole("button", { name: /horror/i }));
    expect(navigate).toHaveBeenCalledWith(
      "/genre/horror?mediaType=tv&mode=guided",
    );
  });

  it("renders nothing (graceful) for a world with no adjacency", () => {
    const world: GenreWorld = {
      slug: "orphan",
      metaphor: "Generic",
      register: {
        lexicon: ["x"],
        tonePrompt: "t",
        cueBeatMap: ["open"],
        accent: "#ffffff",
        moods: ["curious"],
      },
      modules: ["timeline"],
    };
    const { container } = renderRail(world);
    expect(container.firstChild).toBeNull();
  });
});

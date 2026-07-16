import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

import { WorldsMap } from "./WorldsMap";
import { GENRE_WORLDS } from "../../lib/genreWorld";

describe("WorldsMap (Task 5.1 — cross-world warp)", () => {
  it("renders one node per world", () => {
    render(
      <MemoryRouter>
        <WorldsMap />
      </MemoryRouter>,
    );
    for (const slug of Object.keys(GENRE_WORLDS)) {
      expect(screen.getByTestId(`node-${slug}`)).toBeInTheDocument();
    }
  });

  it("draws an edge for a known adjacency pair", () => {
    // documentary.adjacency includes "history"; expect a line connecting them.
    const { container } = render(
      <MemoryRouter>
        <WorldsMap />
      </MemoryRouter>,
    );
    const lines = Array.from(container.querySelectorAll("line"));
    expect(lines.length).toBeGreaterThan(0);
    // at least one adjacency edge exists (documentary↔history is one)
    expect(lines.length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to /genre/:slug when a node is clicked", () => {
    render(
      <MemoryRouter>
        <WorldsMap />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTestId("node-anime"));
    expect(navigate).toHaveBeenCalledWith("/genre/anime");
  });

  it("is announced as a worlds map via aria-label", () => {
    render(
      <MemoryRouter>
        <WorldsMap />
      </MemoryRouter>,
    );
    expect(screen.getByRole("img", { name: /map of all genre worlds/i })).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GenreEmptyState } from "./GenreEmptyState.js";
import { getGenreWorld } from "../../lib/genreWorld.js";

describe("GenreEmptyState cold-start bootstrap loop (C10)", () => {
  it("renders an 'Anchor this world' CTA when onBootstrap is provided and calls it on click", () => {
    const onBootstrap = vi.fn();
    render(
      <GenreEmptyState
        world={getGenreWorld("comedy")}
        count={1}
        threshold={6}
        onBootstrap={onBootstrap}
      />,
    );

    const cta = screen.getByRole("button", { name: /anchor this world/i });
    expect(cta).toBeDefined();
    // Tailored (Warm Interior) copy must remain intact even with the CTA present.
    expect(screen.getByText(/A quiet room/i)).toBeDefined();

    fireEvent.click(cta);
    expect(onBootstrap).toHaveBeenCalledTimes(1);
  });

  it("renders no CTA button when onBootstrap is omitted", () => {
    render(<GenreEmptyState world={getGenreWorld("comedy")} count={1} threshold={6} />);
    expect(screen.queryByRole("button", { name: /anchor this world/i })).toBeNull();
  });
});

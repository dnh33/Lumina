import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ExperienceHero } from "./ExperienceHero.js";
import { getGenreWorld } from "../../lib/genreWorld.js";
import { accentVar } from "../../lib/metaphor.js";

describe("ExperienceHero accent", () => {
  it("sets --world-accent to the world's accent on the root header", () => {
    const world = getGenreWorld("science-fiction");
    const { container } = render(<ExperienceHero slug="science-fiction" world={world} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue("--world-accent")).toBe(accentVar(world));
    // distinct from the amber fallback
    expect(root.style.getPropertyValue("--world-accent")).not.toBe("#f59e0b");
  });

  it("falls back to amber on a world whose accent is unset", () => {
    const world = { ...getGenreWorld("documentary"), register: { ...getGenreWorld("documentary").register, accent: undefined } } as any;
    const { container } = render(<ExperienceHero slug="documentary" world={world} />);
    const root = container.firstChild as HTMLElement;
    expect(root.style.getPropertyValue("--world-accent")).toBe("#f59e0b");
  });
});

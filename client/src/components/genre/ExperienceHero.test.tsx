import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ExperienceHero } from "./ExperienceHero.js";
import { getGenreWorld } from "../../lib/genreWorld.js";
import { accentVar } from "../../lib/metaphor.js";

vi.mock("../../hooks/useNeedleCount.js", () => ({
  useNeedleCount: (n: number | undefined) => n,
}));

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

  it("renders as an Instrument Ink panel: corner reg-ticks, right display numeral, heat strip slot, no gradient fill", () => {
    const world = getGenreWorld("science-fiction");
    const { container, getByTestId } = render(
      <ExperienceHero
        slug="science-fiction"
        world={world}
        titleCount={20}
        anchorsUsed={[{ title: "Blade Runner" }] as any}
        heatItems={[
          {
            tmdbId: 1,
            mediaType: "movie",
            title: "Blade Runner",
            year: 1982,
            overview: "",
            posterPath: "/br.jpg",
            backdropPath: null,
            voteAverage: null,
            genreIds: [],
            popularity: null,
          },
        ]}
      />,
    );
    const root = container.firstChild as HTMLElement;
    // bespoke corner registration ticks (the recurring silhouette)
    expect(root.className).toContain("reg-ticks");
    // NO gradient fill — Instrument Ink is flat carbon, accent rationed
    expect(root.className).not.toContain("bg-gradient-to-br");
    // metaphor carried as a quiet sans whisper (NOT a mono readout — slop.md:
    // monospace-as-house-voice is a tell). Assert it renders, plain sans.
    const metaphor = container.querySelector("p.text-mist-300");
    expect(metaphor).not.toBeNull();
    expect(metaphor?.textContent).toBe(world.metaphor);
    // count is Cabinet display on the RIGHT — never a ghost watermark costume
    expect(container.querySelector(".ghost-numeral")).toBeNull();
    expect(container.querySelector("[data-testid='hero-title-count']")).toBeNull();
    const count = getByTestId("hero-display-count");
    expect(count.textContent).toBe("20");
    expect(count.className).toContain("font-display");
    expect(count.hasAttribute("aria-hidden")).toBe(true);
    // shelf heat fills the right plane with real posters
    expect(getByTestId("hero-heat").querySelectorAll("img").length).toBe(1);
    // H1 uses the display (felt) register via Tailwind font-display utility
    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("font-display");
    expect(h1?.className).not.toContain("font-[var(--font-display)]");
  });

  it("renders the cinematic signature (grain + dust motes) behind the content", () => {
    const world = getGenreWorld("science-fiction");
    const { container } = render(
      <ExperienceHero slug="science-fiction" world={world} titleCount={20} />,
    );
    // film grain layer present
    expect(container.querySelector(".film-grain")).not.toBeNull();
    // compact dosage: 5–6 motes, none gating content visibility
    const motes = container.querySelectorAll("[data-testid='hero-dust-mote']");
    expect(motes.length).toBeGreaterThanOrEqual(5);
    expect(motes.length).toBeLessThanOrEqual(6);
    // faint constellation web (particle craft) — not a certificate numeral
    expect(container.querySelector("[data-testid='constellation-backdrop']")).not.toBeNull();
    expect(container.querySelector(".ghost-numeral")).toBeNull();
    // content is NOT opacity-gated: H1 + metaphor render regardless of motion
    expect(container.querySelector("h1")?.textContent).toBe("Science-fiction");
    expect(container.querySelector("p.text-mist-300")?.textContent).toBe(world.metaphor);
  });

  it("chrome strip keeps atmosphere + right display numeral without billboard heat", () => {
    const world = getGenreWorld("horror");
    const { container, getByTestId, queryByTestId } = render(
      <ExperienceHero
        slug="horror"
        world={world}
        titleCount={42}
        compact
        heatItems={[
          {
            tmdbId: 1,
            mediaType: "movie",
            title: "Hereditary",
            year: 2018,
            overview: "",
            posterPath: "/h.jpg",
            backdropPath: null,
            voteAverage: null,
            genreIds: [],
            popularity: null,
          },
        ]}
      />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("data-hero-compact")).toBe("1");
    const count = getByTestId("hero-display-count");
    expect(count.textContent).toBe("42");
    // Self: ~40–48px @ ~0.25 — not 48px@0.35 limbo, not text-5xl orphan
    expect(count.className).toMatch(/text-\[2\.5rem\]|text-\[2\.75rem\]/);
    expect(count.className).toMatch(/text-mist-100\/25/);
    expect(container.querySelector(".film-grain")).not.toBeNull();
    expect(queryByTestId("hero-heat")).toBeNull();
    expect(container.querySelector(".ghost-numeral")).toBeNull();
    expect(getByTestId("hero-world-name").tagName).toBe("H1");
    expect(getByTestId("hero-world-name").className).toMatch(/text-lg/);
  });

  it("Guided eyebrow demotes world name so Tour owns the display H1", () => {
    const world = getGenreWorld("horror");
    const { getByTestId, container } = render(
      <ExperienceHero
        slug="horror"
        world={world}
        titleCount={12}
        compact
        titleAs="eyebrow"
      />,
    );
    expect(getByTestId("hero-world-name").tagName).toBe("P");
    expect(container.querySelector("h1")).toBeNull();
    const count = getByTestId("hero-display-count");
    expect(count.textContent).toBe("12");
    // Guided quieter: ~32–36px @ ~0.22 so Tour H1 wins the fold
    expect(count.className).toMatch(/text-\[2rem\]|text-\[2\.25rem\]/);
    expect(count.className).toMatch(/text-mist-100\/\[0\.22\]/);
  });
});

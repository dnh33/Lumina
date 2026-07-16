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

  it("renders as an Instrument Ink panel: corner reg-ticks, ghost numeral, mono readout, no gradient fill", () => {
    const world = getGenreWorld("science-fiction");
    const { container } = render(
      <ExperienceHero slug="science-fiction" world={world} titleCount={20} anchorsUsed={[{ title: "Blade Runner" }] as any} />,
    );
    const root = container.firstChild as HTMLElement;
    // bespoke corner registration ticks (the recurring silhouette)
    expect(root.className).toContain("reg-ticks");
    // NO gradient fill — Instrument Ink is flat carbon, accent rationed
    expect(root.className).not.toContain("bg-gradient-to-br");
    // metaphor carried as a quiet sans whisper (NOT a mono readout — slop.md:
    // monospace-as-house-voice is a tell). Assert it renders, plain sans.
    const metaphor = container.querySelector("p.text-mist-400");
    expect(metaphor).not.toBeNull();
    expect(metaphor?.textContent).toBe(world.metaphor);
    // ghost numeral watermark behind the text
    const ghost = container.querySelector(".ghost-numeral");
    expect(ghost).not.toBeNull();
    expect(ghost?.textContent).toBe("20");
    // H1 uses the display (felt) register
    const h1 = container.querySelector("h1");
    expect(h1?.className).toContain("font-[var(--font-display)]");
  });

  it("renders the cinematic signature (grain + dust motes) behind the content", () => {
    const world = getGenreWorld("science-fiction");
    const { container } = render(
      <ExperienceHero slug="science-fiction" world={world} titleCount={20} />,
    );
    // film grain layer present
    expect(container.querySelector(".film-grain")).not.toBeNull();
    // a handful of dust motes, none gating content visibility
    const motes = container.querySelectorAll(".dust-mote");
    expect(motes.length).toBeGreaterThanOrEqual(6);
    // content is NOT opacity-gated: H1 + metaphor render regardless of motion
    expect(container.querySelector("h1")?.textContent).toBe("Science-fiction");
    expect(container.querySelector("p.text-mist-400")?.textContent).toBe(world.metaphor);
  });
});

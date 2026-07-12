import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
// framer-motion caches the reduced-motion preference in a module singleton
// (`prefersReducedMotion`) initialised lazily on first useReducedMotion call.
// jsdom has no matchMedia, so we drive that singleton directly (see SparkAvatar.test).
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { SuggestionCards, type Suggestion } from "./SuggestionCards";

const suggestions: Suggestion[] = [
  { title: "The Quiet Hour", subtitle: "slow-burn drama" },
  { title: "Signal to Noise", subtitle: "sci-fi" },
  { title: "Paper Moons", subtitle: "indie" },
];

afterEach(() => {
  cleanup();
  // reset singleton between tests
  prefersReducedMotion.current = false;
  hasReducedMotionListener.current = true;
});

function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true; // skip lazy matchMedia init
  prefersReducedMotion.current = reduce;
}

describe("SuggestionCards", () => {
  it("renders one poster card per suggestion (3 for 3 suggestions)", () => {
    render(<SuggestionCards suggestions={suggestions} />);
    const cards = screen.getAllByRole("button", {
      name: /The Quiet Hour|Signal to Noise|Paper Moons/,
    });
    expect(cards).toHaveLength(3);
  });

  it("applies the posterDeal stagger container (data-deal marker present)", () => {
    const { container } = render(<SuggestionCards suggestions={suggestions} />);
    const deal = container.querySelector('[data-deal="posterDeal"]');
    expect(deal).not.toBeNull();
    expect(deal).toHaveAttribute("data-deal", "posterDeal");
  });

  it("still renders text under reduced motion with no rotateX transform", () => {
    setReducedMotion(true);
    const { container } = render(<SuggestionCards suggestions={suggestions} />);
    // text present
    expect(screen.getByText("The Quiet Hour")).toBeInTheDocument();
    // reduced branch uses opacity/translate only — never rotateX
    const cards = container.querySelectorAll("[data-poster-card]");
    expect(cards.length).toBe(3);
    cards.forEach((c) => {
      const style = (c as HTMLElement).style.transform || "";
      expect(style.toLowerCase()).not.toContain("rotatex");
    });
  });

  it("preserves the legacy items API (renders nothing when both props omitted)", () => {
    const { container } = render(<SuggestionCards />);
    expect(container.firstChild).toBeNull();
  });
});

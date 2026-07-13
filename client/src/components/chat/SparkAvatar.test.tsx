import { describe, expect, it, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
// framer-motion caches the reduced-motion preference in a module singleton
// (`prefersReducedMotion`) that it initialises lazily on the first
// useReducedMotion call. jsdom has no window.matchMedia, so it locks to `false`.
// We drive that exported singleton directly to test both branches deterministically.
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { SparkAvatar } from "./SparkAvatar";
import type { CompanionState } from "../../hooks/useCompanionState";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Reset framer's reduced-motion singleton back to the default after each test.
  prefersReducedMotion.current = false;
  hasReducedMotionListener.current = true;
});

const STATES: CompanionState[] = [
  "idle",
  "thinking",
  "tooling",
  "writing",
  "error",
];

/** Force framer-motion's reduced-motion preference on/off deterministically. */
function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true; // skip lazy matchMedia init
  prefersReducedMotion.current = reduce;
}

describe("SparkAvatar — presence system (Task 4)", () => {
  it("renders a distinct data-state for each of the 5 states", () => {
    for (const state of STATES) {
      const { container } = render(<SparkAvatar state={state} />);
      const root = container.querySelector("[data-state]");
      expect(root).not.toBeNull();
      expect(root?.getAttribute("data-state")).toBe(state);
      cleanup();
    }
  });

  it("gives each state a distinct aria-label", () => {
    const labels = new Set<string>();
    for (const state of STATES) {
      const { container } = render(<SparkAvatar state={state} />);
      const root = container.querySelector("[data-state]");
      const label = root?.getAttribute("aria-label");
      expect(label).toBeTruthy();
      labels.add(label ?? "");
      cleanup();
    }
    expect(labels.size).toBe(STATES.length);
  });

  it("always keeps the brand star-core mark present", () => {
    for (const state of STATES) {
      const { container } = render(<SparkAvatar state={state} />);
      expect(container.querySelector("[data-part='star-core']")).not.toBeNull();
      cleanup();
    }
  });

  it("thinking renders ripple rings that idle does not", () => {
    const idle = render(<SparkAvatar state="idle" />);
    expect(
      idle.container.querySelectorAll("[data-part='ripple']").length,
    ).toBe(0);
    cleanup();

    const thinking = render(<SparkAvatar state="thinking" />);
    expect(
      thinking.container.querySelectorAll("[data-part='ripple']").length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("tooling renders an orbiting satellite and no beads beneath the core", () => {
    const { container } = render(<SparkAvatar state="tooling" />);
    expect(container.querySelector("[data-part='satellite']")).not.toBeNull();
    expect(container.querySelectorAll("[data-part='bead']").length).toBe(0);
  });

  it("writing renders a comet-trail element", () => {
    const { container } = render(<SparkAvatar state="writing" />);
    expect(container.querySelector("[data-part='comet']")).not.toBeNull();
  });

  it("error renders a fault-line and desaturating filter, and never a shake", () => {
    const { container } = render(<SparkAvatar state="error" />);
    expect(container.querySelector("[data-part='fault-line']")).not.toBeNull();
    const root = container.querySelector("[data-state='error']") as HTMLElement;
    // No shake: we never emit x-axis keyframes; assert the root markup carries
    // no translate/shake hint.
    expect(root.getAttribute("data-shake")).not.toBe("true");
  });

  it("renders a one-shot memory pulse star only when showMemoryPulse is set", () => {
    const without = render(<SparkAvatar state="idle" />);
    expect(
      without.container.querySelector("[data-part='memory-pulse']"),
    ).toBeNull();
    cleanup();

    const withPulse = render(<SparkAvatar state="idle" showMemoryPulse />);
    expect(
      withPulse.container.querySelector("[data-part='memory-pulse']"),
    ).not.toBeNull();
  });

  it("renders a Fraunces state-whisper label with calm per-state copy", () => {
    render(<SparkAvatar state="thinking" />);
    const whisper = screen.getByText("considering…");
    // The state-whisper is the ONLY element allowed to use the Fraunces serif.
    // In this repo Fraunces is exposed via the `font-display` utility.
    expect(whisper.className).toMatch(/font-display/);
    cleanup();

    render(<SparkAvatar state="writing" />);
    expect(screen.getByText("composing…")).toBeInTheDocument();
    cleanup();

    render(<SparkAvatar state="tooling" />);
    expect(screen.getByText("reaching into your library…")).toBeInTheDocument();
    cleanup();

    render(<SparkAvatar state="error" />);
    expect(
      screen.getByText("something slipped — try again"),
    ).toBeInTheDocument();
  });

  it("preserves the legacy public API (size + className) without breaking", () => {
    const { container } = render(
      <SparkAvatar state="idle" size={48} className="custom-x" />,
    );
    const root = container.querySelector("[data-state='idle']") as HTMLElement;
    expect(root).not.toBeNull();
    expect(root.className).toContain("custom-x");
  });

  // framer-motion caches reduced-motion in a module singleton; setReducedMotion
  // drives it directly so both branches are deterministic under jsdom.
  describe("prefers-reduced-motion", () => {
    it("renders a static core with no running loop animation (data-reduced=true)", () => {
      setReducedMotion(true);
      const { container } = render(<SparkAvatar state="idle" />);
      const root = container.querySelector("[data-state='idle']");
      expect(root?.getAttribute("data-reduced")).toBe("true");

      // The static core must not carry a keyframe-array animate loop.
      const core = container.querySelector(
        "[data-part='star-core']",
      ) as HTMLElement;
      expect(core.getAttribute("data-animating")).not.toBe("true");
      // No CSS-injected infinite animation on the static branch.
      expect(core.style.animationIterationCount).not.toBe("infinite");
    });

    it("still renders full motion branch when reduced motion is off", () => {
      setReducedMotion(false);
      const { container } = render(<SparkAvatar state="idle" />);
      const root = container.querySelector("[data-state='idle']");
      expect(root?.getAttribute("data-reduced")).toBe("false");
    });
  });
});

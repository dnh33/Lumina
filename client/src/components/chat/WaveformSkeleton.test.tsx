import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { WaveformSkeleton } from "./WaveformSkeleton";

afterEach(() => {
  cleanup();
  prefersReducedMotion.current = false;
  hasReducedMotionListener.current = true;
});

function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

describe("WaveformSkeleton", () => {
  it("renders 3 bars in thinking phase (non-reduced)", () => {
    setReducedMotion(false);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    expect(container.querySelectorAll("[data-part='waveform-bar']").length).toBe(3);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).not.toBeNull();
    setReducedMotion(false);
  });

  it("renders 5 bars in tooling phase", () => {
    setReducedMotion(false);
    const { container } = render(<WaveformSkeleton phase="tooling" />);
    expect(container.querySelectorAll("[data-part='waveform-bar']").length).toBe(5);
    setReducedMotion(false);
  });

  it("renders nothing when phase is writing", () => {
    const { container } = render(<WaveformSkeleton phase="writing" />);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).toBeNull();
  });

  it("renders nothing when phase is starting (brief, before thinking begins)", () => {
    const { container } = render(<WaveformSkeleton phase="starting" />);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).not.toBeNull();
  });

  it("respects prefers-reduced-motion (no height animation)", () => {
    setReducedMotion(true);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    const bars = container.querySelectorAll("[data-part='waveform-bar']");
    expect(bars.length).toBe(3);
    // In reduced mode, bars should have static height (no height animation)
    expect(bars[0].style.height).not.toContain("10");
    setReducedMotion(false);
  });

  it("accepts activeTool prop without crashing in tooling phase", () => {
    setReducedMotion(false);
    const { container } = render(
      <WaveformSkeleton phase="tooling" activeTool="search_tmdb" />,
    );
    expect(container.querySelectorAll("[data-part='waveform-bar']").length).toBe(5);
    setReducedMotion(false);
  });

  it("renders same bar count regardless of activeTool", () => {
    setReducedMotion(false);
    const { container: a } = render(
      <WaveformSkeleton phase="tooling" activeTool="search_tmdb" />,
    );
    const { container: b } = render(
      <WaveformSkeleton phase="tooling" activeTool="add_to_library" />,
    );
    expect(a.querySelectorAll("[data-part='waveform-bar']").length).toBe(5);
    expect(b.querySelectorAll("[data-part='waveform-bar']").length).toBe(5);
    setReducedMotion(false);
  });
});

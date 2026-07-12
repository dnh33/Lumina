import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
// framer-motion caches reduced-motion in a module singleton; drive it directly.
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { ReasoningInterstitial, type ReasoningStep } from "./ReasoningInterstitial";

const steps: ReasoningStep[] = [
  { label: "Search your library", status: "done" },
  { label: "Build a slow-burn arc", status: "running" },
];

afterEach(() => {
  cleanup();
  prefersReducedMotion.current = false;
  hasReducedMotionListener.current = true;
});

function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

describe("ReasoningInterstitial", () => {
  it("shows the anchored panel when visible and hides the trace by default", () => {
    render(<ReasoningInterstitial visible steps={steps} />);
    expect(screen.getByText(/Lumina is working/i)).toBeInTheDocument();
    // trace hidden until toggled
    expect(screen.queryByText("Search your library")).not.toBeInTheDocument();
    expect(screen.queryByText("Build a slow-burn arc")).not.toBeInTheDocument();
  });

  it("reveals both steps when the toggle is clicked", () => {
    render(<ReasoningInterstitial visible steps={steps} />);
    const toggle = screen.getByRole("button", { name: /How I got there/i });
    fireEvent.click(toggle);
    expect(screen.getByText("Search your library")).toBeInTheDocument();
    expect(screen.getByText("Build a slow-burn arc")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("renders nothing when not visible", () => {
    const { container } = render(<ReasoningInterstitial visible={false} steps={steps} />);
    expect(screen.queryByText(/Lumina is working/i)).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("works under reduced motion (toggle still reveals steps)", () => {
    setReducedMotion(true);
    render(<ReasoningInterstitial visible steps={steps} />);
    expect(screen.getByText(/Lumina is working/i)).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /How I got there/i });
    fireEvent.click(toggle);
    expect(screen.getByText("Search your library")).toBeInTheDocument();
    expect(screen.getByText("Build a slow-burn arc")).toBeInTheDocument();
  });
});

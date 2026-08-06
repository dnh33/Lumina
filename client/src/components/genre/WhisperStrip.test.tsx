import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhisperStrip } from "./WhisperStrip.js";

// --- tests -----------------------------------------------------------------

describe("WhisperStrip deterministic phrase (3.6 / C5)", () => {
  it("names shelf scope when decade is set (Timeline owns the decade token)", () => {
    render(
      <WhisperStrip decade={2010} count={12} anchorCount={3} unwatched={2} />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toContain("shelf");
    expect(line.textContent).not.toContain("2010s");
    expect(line.textContent).toContain("3 anchors");
    expect(line.textContent).toContain("2 unwatched");
  });

  it("handles a null decade as 'every era'", () => {
    render(
      <WhisperStrip decade={null} count={5} anchorCount={1} unwatched={0} />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toContain("every era");
    expect(line.textContent).toContain("1 anchor");
  });

  it("is deterministic for the same inputs", () => {
    const a = render(<WhisperStrip decade={1990} count={9} anchorCount={0} unwatched={4} />);
    const b = render(<WhisperStrip decade={1990} count={9} anchorCount={0} unwatched={4} />);
    expect(a.container.textContent).toBe(b.container.textContent);
  });

  it("names guided claim fold when guided=true (no bare every era)", () => {
    render(
      <WhisperStrip
        decade={null}
        anchorCount={2}
        unwatched={5}
        guided
        guidedStage="claim"
        eraBand="Classic band"
      />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toMatch(/Guided claim/);
    expect(line.textContent).toMatch(/Classic band/);
    expect(line.textContent).not.toMatch(/every era/);
    expect(line.getAttribute("data-guided-stage")).toBe("claim");
  });

  it("Guided widen with All eras does not claim Classic band as scrub truth", () => {
    render(
      <WhisperStrip
        decade={null}
        anchorCount={2}
        unwatched={5}
        guided
        guidedStage="browse"
        eraBand="Classic band"
      />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toMatch(/Guided widen/);
    expect(line.textContent).toMatch(/Classic band parked/);
    expect(line.textContent).toMatch(/all eras in band/);
  });

  it("Guided widen with decade zoom keeps Classic band + decade", () => {
    render(
      <WhisperStrip
        decade={1960}
        anchorCount={2}
        unwatched={5}
        guided
        guidedStage="browse"
        eraBand="Classic band"
      />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toBe(
      "Guided widen · Classic band · archive open.",
    );
  });

  it("prefers live guidedCue over default guided whisper", () => {
    render(
      <WhisperStrip
        decade={2010}
        anchorCount={2}
        unwatched={5}
        guided
        guidedCue="Guided · tempo Patient cut · shelf reshaped"
      />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toBe(
      "Guided · tempo Patient cut · shelf reshaped",
    );
    expect(line.getAttribute("data-guided-cue")).toBe("1");
  });
});

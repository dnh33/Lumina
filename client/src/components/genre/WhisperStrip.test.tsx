import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhisperStrip } from "./WhisperStrip.js";

// --- tests -----------------------------------------------------------------

describe("WhisperStrip deterministic phrase (3.6 / C5)", () => {
  it("includes the decade token and anchor count", () => {
    render(
      <WhisperStrip decade={2010} count={12} anchorCount={3} unwatched={2} />,
    );
    const line = screen.getByTestId("whisper-strip");
    expect(line.textContent).toContain("2010s");
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
});

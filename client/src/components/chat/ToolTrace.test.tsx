import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// framer-motion's useReducedMotion() subscribes to a process-wide media-query
// singleton the first time it mounts and never re-reads it — so per-test
// matchMedia mocking is unreliable. Instead we mock the hook's return via a
// hoisted mutable ref (the app still wraps in <MotionConfig reducedMotion="user">,
// per plan Task 2, which is the real runtime signal).
const { reducedRef } = vi.hoisted(() => ({ reducedRef: { current: false } }));
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => reducedRef.current,
  };
});

import { ToolTrace, type ToolTraceNode } from "./ToolTrace";

const STEPS: ToolTraceNode[] = [
  { name: "search", done: true, summary: "Searched the catalog for slow-burn sci-fi" },
  { name: "add_to_library", done: true, summary: "Saved 'Arrival' to your library" },
];

describe("ToolTrace (tool-use trace rail — T11 / T12 / T13)", () => {
  it("renders tool steps in order with a connecting line, summary text, and a fixed node height", () => {
    reducedRef.current = false;
    render(<ToolTrace steps={STEPS} />);

    // Two nodes, in DOM order.
    const nodes = screen.getAllByTestId("tooltrace-node");
    expect(nodes).toHaveLength(2);
    expect(nodes[0].textContent).toContain("Searched the catalog");
    expect(nodes[1].textContent).toContain("Saved 'Arrival'");

    // The connecting rail line is present.
    expect(screen.getByTestId("tooltrace-line")).toBeInTheDocument();

    // Human summary shown (not raw JSON args).
    expect(
      screen.getByText(/Searched the catalog for slow-burn sci-fi/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Saved 'Arrival' to your library/),
    ).toBeInTheDocument();
    // No raw JSON / event plumbing leaked into the trace.
    expect(document.body.textContent).not.toContain("{");
    expect(document.body.textContent).not.toContain("tool_done");

    // Each node container reserves a fixed min-height (no spinner→summary shift).
    for (const node of nodes) {
      expect(node.style.minHeight).toBeTruthy();
    }
  });

  it("does NOT render the travelling spark under prefers-reduced-motion", () => {
    reducedRef.current = true;
    render(
      <ToolTrace
        steps={[
          { name: "search", done: false, summary: "Searching…" },
          { name: "add_to_library", done: false },
        ]}
      />,
    );
    expect(screen.queryByTestId("tooltrace-spark")).not.toBeInTheDocument();
  });

  it("renders the spark while a tool is running (non-reduced motion)", () => {
    reducedRef.current = false;
    render(
      <ToolTrace
        steps={[
          { name: "search", done: true, summary: "Done" },
          { name: "add_to_library", done: false },
        ]}
      />,
    );
    expect(screen.getByTestId("tooltrace-spark")).toBeInTheDocument();
  });
});

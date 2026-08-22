import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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

const LIVE_STEPS: ToolTraceNode[] = [
  {
    name: "search_tmdb",
    done: true,
    summary: "Searching the catalog",
    detail: "“slow-burn sci-fi”",
    outcome: "8 results",
  },
  { name: "get_title_details", done: false, summary: "Pulling title details" },
];

const DONE_STEPS: ToolTraceNode[] = [
  { name: "search_library", done: true, summary: "Reading your library", outcome: "3 matches" },
  { name: "search_tmdb", done: true, summary: "Searching the catalog", detail: "“korean thrillers”", outcome: "8 results" },
  { name: "search_tmdb", done: true, summary: "Searching the catalog", detail: "“slow burn”", outcome: "5 results" },
  { name: "get_title_details", done: true, summary: "Pulling title details", outcome: "Counterpart (2018)" },
];

describe("ToolTrace (compact trace rail — T11 / T12 / T13 + progressive disclosure)", () => {
  it("while working: renders one compact row per step with label, argument detail and outcome", () => {
    reducedRef.current = false;
    render(<ToolTrace steps={LIVE_STEPS} />);

    const nodes = screen.getAllByTestId("tooltrace-node");
    expect(nodes).toHaveLength(2);
    // Verb label + salient argument + result digest — never raw JSON.
    expect(nodes[0].textContent).toContain("Searching the catalog");
    expect(nodes[0].textContent).toContain("“slow-burn sci-fi”");
    expect(nodes[0].textContent).toContain("8 results");
    expect(nodes[1].textContent).toContain("Pulling title details");
    expect(document.body.textContent).not.toContain("{");
    expect(document.body.textContent).not.toContain("tool_done");

    // The connecting rail line is present, rows reserve a fixed min-height
    // (no shift when the outcome lands).
    expect(screen.getByTestId("tooltrace-line")).toBeInTheDocument();
    for (const node of nodes) {
      expect(node.style.minHeight).toBeTruthy();
    }

    // No collapsed summary while a step is still running.
    expect(screen.queryByTestId("tooltrace-summary")).not.toBeInTheDocument();
  });

  it("when all steps are done: auto-collapses to one grouped past-tense summary line", () => {
    reducedRef.current = false;
    render(<ToolTrace steps={DONE_STEPS} />);

    const summary = screen.getByTestId("tooltrace-summary");
    expect(summary.textContent).toContain("Read your library");
    expect(summary.textContent).toContain("Searched the catalog ×2");
    expect(summary.textContent).toContain("Pulled title details");
    expect(summary).toHaveAttribute("aria-expanded", "false");

    // The full rows are tucked away.
    expect(screen.queryByTestId("tooltrace-node")).not.toBeInTheDocument();
  });

  it("expands the collapsed summary on click, revealing the full trace, and collapses again", () => {
    reducedRef.current = true; // exercise the reduce path too
    render(<ToolTrace steps={DONE_STEPS} />);

    const summary = screen.getByTestId("tooltrace-summary");
    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    const nodes = screen.getAllByTestId("tooltrace-node");
    expect(nodes).toHaveLength(4);
    expect(nodes[3].textContent).toContain("Counterpart (2018)");

    fireEvent.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "false");
  });

  it("does NOT render the travelling spark under prefers-reduced-motion", () => {
    reducedRef.current = true;
    render(
      <ToolTrace
        steps={[
          { name: "search_tmdb", done: false, summary: "Searching…" },
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
          { name: "search_tmdb", done: true, summary: "Done" },
          { name: "add_to_library", done: false },
        ]}
      />,
    );
    expect(screen.getByTestId("tooltrace-spark")).toBeInTheDocument();
  });

  it("groups identical concurrent (not-done) tool calls into one batched row", () => {
    reducedRef.current = false;
    render(
      <ToolTrace
        steps={[
          { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"korean thrillers\"" },
          { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"slow burn\"" },
          { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"giallo\"" },
          { name: "get_title_details", done: false, summary: "Pulling title details" },
        ]}
      />,
    );

    const nodes = screen.getAllByTestId("tooltrace-node");
    // 3 search_tmdb calls batched into 1 + 1 get_title_details = 2 nodes
    expect(nodes).toHaveLength(2);
    expect(nodes[0].textContent).toContain("Searching the catalog");
    // Count badge shows the batch count
    expect(nodes[0].textContent).toContain("×3");
    expect(nodes[1].textContent).toContain("Pulling title details");
  });

  it("does not group done steps — each finished call stays separate for the summary", () => {
    reducedRef.current = false;
    render(
      <ToolTrace
        steps={[
          { name: "search_tmdb", done: true, summary: "Searching the catalog", detail: "\"korean\"" },
          { name: "search_tmdb", done: true, summary: "Searching the catalog", detail: "\"slow\"" },
          { name: "get_title_details", done: true, summary: "Pulling title details" },
        ]}
      />,
    );

    // All done → collapsed summary
    const summary = screen.getByTestId("tooltrace-summary");
    expect(summary.textContent).toContain("Searched the catalog ×2");
    expect(summary.textContent).toContain("Pulled title details");
    // No individual rows while collapsed
    expect(screen.queryByTestId("tooltrace-node")).not.toBeInTheDocument();
  });
});

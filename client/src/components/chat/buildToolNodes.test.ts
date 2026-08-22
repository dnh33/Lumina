import { describe, expect, it } from "vitest";
import { buildToolNodes, groupConcurrentSteps, summarizeTrace } from "./buildToolNodes";
import type { ToolStep } from "./useChat";

describe("buildToolNodes", () => {
  it("maps ToolStep[] to ToolNode[] with count=1", () => {
    const steps: ToolStep[] = [
      {
        name: "search_tmdb",
        done: false,
        summary: "Searching the catalog",
        detail: "\"korean thrillers\"",
        outcome: undefined,
      },
      {
        name: "get_title_details",
        done: true,
        summary: "Pulling title details",
        detail: undefined,
        outcome: "Severance (2021)",
      },
    ];
    const nodes = buildToolNodes(steps);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual({
      name: "search_tmdb",
      done: false,
      summary: "Searching the catalog",
      detail: "\"korean thrillers\"",
      outcome: undefined,
      count: 1,
    });
    expect(nodes[1].done).toBe(true);
    expect(nodes[1].outcome).toBe("Severance (2021)");
    expect(nodes.every((n) => n.count === 1)).toBe(true);
  });
});

describe("groupConcurrentSteps", () => {
  it("returns a single node unchanged (no batching needed)", () => {
    const nodes = buildToolNodes([
      { name: "search_tmdb", done: false, summary: "Searching…" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(1);
  });

  it("groups 3 identical concurrent search_tmdb calls into one node with count=3", () => {
    const nodes = buildToolNodes([
      { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"korean\"" },
      { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"slow\"" },
      { name: "search_tmdb", done: false, summary: "Searching the catalog", detail: "\"giallo\"" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(3);
    expect(grouped[0].name).toBe("search_tmdb");
    // Details are joined
    expect(grouped[0].detail).toContain("korean");
    expect(grouped[0].detail).toContain("slow");
    expect(grouped[0].detail).toContain("giallo");
  });

  it("groups concurrent calls of the same type but leaves different types separate", () => {
    const nodes = buildToolNodes([
      { name: "search_tmdb", done: false, summary: "Searching" },
      { name: "search_tmdb", done: false, summary: "Searching" },
      { name: "get_title_details", done: false, summary: "Pulling" },
      { name: "search_tmdb", done: false, summary: "Searching" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    // 2 search_tmdb batched + 1 get_title_details = 2 nodes
    expect(grouped).toHaveLength(2);
    expect(grouped[0].count).toBe(3);
    expect(grouped[1].count).toBe(1);
  });

  it("does NOT group done steps — they pass through as-is", () => {
    const nodes = buildToolNodes([
      { name: "search_tmdb", done: true, summary: "Searched" },
      { name: "search_tmdb", done: true, summary: "Searched" },
      { name: "search_tmdb", done: true, summary: "Searched" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    expect(grouped).toHaveLength(3);
    expect(grouped.every((n) => n.count === 1)).toBe(true);
  });

  it("groups pending and preserves done steps in order", () => {
    const nodes = buildToolNodes([
      { name: "search_library", done: true, summary: "Read library" },
      { name: "search_tmdb", done: false, summary: "Searching" },
      { name: "search_tmdb", done: false, summary: "Searching" },
      { name: "get_title_details", done: true, summary: "Pulled" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    // Done steps pass through in order; pending groups are batched and appended.
    // Order: search_library (done) → get_title_details (done) → batched search_tmdb ×2
    expect(grouped).toHaveLength(3);
    expect(grouped[0].done).toBe(true);
    expect(grouped[0].name).toBe("search_library");
    expect(grouped[1].done).toBe(true);
    expect(grouped[1].name).toBe("get_title_details");
    expect(grouped[2].done).toBe(false);
    expect(grouped[2].count).toBe(2);
  });

  it("preserves outcome on done steps", () => {
    const nodes = buildToolNodes([
      { name: "search_tmdb", done: true, outcome: "8 results" },
    ]);
    const grouped = groupConcurrentSteps(nodes);
    expect(grouped[0].outcome).toBe("8 results");
  });

  it("handles empty input", () => {
    expect(groupConcurrentSteps([])).toHaveLength(0);
  });
});

describe("summarizeTrace", () => {
  it("groups repeat calls with ×N notation", () => {
    const steps: Pick<ToolStep, "name">[] = [
      { name: "search_library" },
      { name: "search_tmdb" },
      { name: "search_tmdb" },
      { name: "search_tmdb" },
    ];
    const summary = summarizeTrace(steps);
    expect(summary).toContain("Read your library");
    expect(summary).toContain("Searched the catalog ×3");
  });

  it("folds beyond 3 segments into +n more", () => {
    const steps: Pick<ToolStep, "name">[] = [
      { name: "search_library" },
      { name: "search_tmdb" },
      { name: "search_tmdb" },
      { name: "get_title_details" },
      { name: "get_title_details" },
    ];
    const summary = summarizeTrace(steps);
    // 3 segments: "Read your library", "Searched the catalog ×2", "Pulled title details ×2"
    // 3 segments = exactly MAX_SUMMARY_SEGMENTS, so no fold
    expect(summary).not.toContain("+");
  });

  it("folds to +n more when exceeding 3 unique tool types", () => {
    const steps: Pick<ToolStep, "name">[] = [
      { name: "search_library" },
      { name: "search_tmdb" },
      { name: "get_title_details" },
      { name: "add_to_library" },
    ];
    const summary = summarizeTrace(steps);
    // 4 segments > MAX_SUMMARY_SEGMENTS (3)
    expect(summary).toContain("+");
    expect(summary).toContain("+1 more");
  });
});

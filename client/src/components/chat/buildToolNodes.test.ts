import { describe, expect, it } from "vitest";
import { buildToolNodes, deriveStopped, summarizeTrace } from "./buildToolNodes";
import type { ToolStep } from "./useChat";

describe("buildToolNodes", () => {
  it("passes name/done/summary/detail/outcome through to trace nodes", () => {
    const steps: ToolStep[] = [
      {
        name: "search_tmdb",
        done: true,
        summary: "Searching the catalog",
        detail: "“korean thrillers”",
        outcome: "8 results",
      },
      { name: "get_title_details", done: false, summary: null },
    ];
    expect(buildToolNodes(steps)).toEqual([
      {
        name: "search_tmdb",
        done: true,
        summary: "Searching the catalog",
        detail: "“korean thrillers”",
        outcome: "8 results",
      },
      {
        name: "get_title_details",
        done: false,
        summary: undefined,
        detail: undefined,
        outcome: undefined,
      },
    ]);
  });
});

describe("summarizeTrace", () => {
  it("groups repeat calls with ×N in first-appearance order, past tense", () => {
    const steps = [
      { name: "search_library" },
      { name: "search_tmdb" },
      { name: "search_tmdb" },
      { name: "search_tmdb" },
      { name: "get_title_details" },
      { name: "get_title_details" },
    ];
    expect(summarizeTrace(steps)).toBe(
      "Read your library · Searched the catalog ×3 · Pulled title details ×2",
    );
  });

  it("folds groups beyond three into '+n more'", () => {
    const steps = [
      { name: "search_library" },
      { name: "get_taste_profile" },
      { name: "search_tmdb" },
      { name: "discover_titles" },
      { name: "compare_titles" },
    ];
    expect(summarizeTrace(steps)).toBe(
      "Read your library · Studied your taste · Searched the catalog · +2 more",
    );
  });

  it("falls back to the raw name for unknown tools and returns '' when empty", () => {
    expect(summarizeTrace([{ name: "mystery_tool" }])).toBe("mystery_tool");
    expect(summarizeTrace([])).toBe("");
  });
});

describe("deriveStopped (graceful stop, T14/T15)", () => {
  it("is true only once streaming has ended AND a stop was requested", () => {
    expect(deriveStopped(true, true)).toBe(false); // still streaming
    expect(deriveStopped(false, true)).toBe(true); // stopped
    expect(deriveStopped(false, false)).toBe(false); // normal finish
    expect(deriveStopped(true, false)).toBe(false); // live turn
  });
});

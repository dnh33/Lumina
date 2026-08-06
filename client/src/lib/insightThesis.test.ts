import { describe, it, expect } from "vitest";
import {
  stripInlineMarkdown,
  isRawPayloadDump,
  normalizeInsightThesis,
  fallbackThesisFromItem,
} from "./insightThesis.js";

describe("insightThesis", () => {
  it("strips bold markdown without leaving asterisks", () => {
    expect(stripInlineMarkdown("See **Alien** tonight")).toBe("See Alien tonight");
  });

  it("detects raw insight JSON dumps", () => {
    const dump = `{ "verdict": "maybe", "matchScore": null, "comparisons": [] }`;
    expect(isRawPayloadDump(dump)).toBe(true);
    expect(isRawPayloadDump("A real thesis about noir.")).toBe(false);
  });

  it("never returns JSON as thesis — falls back to prose", () => {
    const dump = `{ "verdict": "maybe", "matchScore": null, "comparisons": [{"title":"X"}] }`;
    expect(normalizeInsightThesis(dump, "Graceful fallback.")).toBe(
      "Graceful fallback.",
    );
    expect(normalizeInsightThesis(dump)).toBeNull();
  });

  it("accepts clean hook strings and strips markdown", () => {
    expect(normalizeInsightThesis("**High and Low** cuts deep.")).toBe(
      "High and Low cuts deep.",
    );
  });

  it("ignores object dumps — pulls hook if present, else null", () => {
    expect(
      normalizeInsightThesis({
        verdict: "maybe",
        matchScore: null,
        comparisons: [],
      }),
    ).toBeNull();
    expect(
      normalizeInsightThesis({ hook: "**Noir** done right.", verdict: "maybe" }),
    ).toBe("Noir done right.");
  });

  it("builds a deterministic fallback from overview", () => {
    expect(
      fallbackThesisFromItem({
        title: "High and Low",
        overview: "A wealthy executive faces a kidnapping. More plot follows.",
        year: 1963,
      }),
    ).toBe("A wealthy executive faces a kidnapping.");
  });
});

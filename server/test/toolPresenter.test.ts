import { describe, expect, it } from "vitest";
import { toolDetail, toolOutcome } from "../src/llm/toolPresenter.js";

describe("toolDetail — salient argument as a short human fragment", () => {
  it("quotes search queries", () => {
    expect(toolDetail("search_tmdb", JSON.stringify({ query: "korean thrillers" }))).toBe(
      "“korean thrillers”",
    );
    expect(toolDetail("search_library", JSON.stringify({ query: "slow burn" }))).toBe(
      "“slow burn”",
    );
  });

  it("clips long queries with an ellipsis", () => {
    const long = "a".repeat(80);
    const d = toolDetail("search_tmdb", JSON.stringify({ query: long }))!;
    expect(d.length).toBeLessThan(50);
    expect(d.endsWith("…”")).toBe(true);
  });

  it("describes discover filters (genres · era · sort)", () => {
    expect(
      toolDetail(
        "discover_titles",
        JSON.stringify({
          media_type: "movie",
          genres: ["Science Fiction", "Thriller"],
          year_from: 1990,
          year_to: 1999,
          sort: "acclaimed",
        }),
      ),
    ).toBe("Science Fiction + Thriller · 1990–1999 · acclaimed");
  });

  it("shows title query and episode scope for progress writes", () => {
    expect(
      toolDetail(
        "set_episode_progress",
        JSON.stringify({ title_query: "Severance", season: 2, episode: 5 }),
      ),
    ).toBe("“Severance” · S2E5");
  });

  it("returns undefined for tools without salient args and for malformed args", () => {
    expect(toolDetail("get_taste_profile", "{}")).toBeUndefined();
    expect(toolDetail("get_title_details", JSON.stringify({ tmdb_id: 603 }))).toBeUndefined();
    expect(toolDetail("search_tmdb", "not json")).toBeUndefined();
    expect(toolDetail("search_tmdb", JSON.stringify({ query: "  " }))).toBeUndefined();
  });
});

describe("toolOutcome — result digest as a short human fragment", () => {
  it("counts list results with correct pluralisation", () => {
    expect(toolOutcome("search_tmdb", JSON.stringify([{}, {}, {}]))).toBe("3 results");
    expect(toolOutcome("search_tmdb", JSON.stringify([{}]))).toBe("1 result");
    expect(toolOutcome("search_tmdb", "[]")).toBe("no results");
    expect(toolOutcome("search_library", JSON.stringify([{}, {}]))).toBe("2 matches");
    expect(toolOutcome("discover_titles", JSON.stringify([{}]))).toBe("1 candidate");
  });

  it("names the resolved title for detail lookups", () => {
    expect(
      toolOutcome("get_title_details", JSON.stringify({ title: "Counterpart", year: 2018 })),
    ).toBe("Counterpart (2018)");
    expect(toolOutcome("get_title_details", JSON.stringify({ title: "Devs" }))).toBe("Devs");
  });

  it("summarises progress, comparisons and continuing series", () => {
    expect(
      toolOutcome(
        "get_episode_progress",
        JSON.stringify({ title: "The Americans", watched: 42, total: 75 }),
      ),
    ).toBe("The Americans · 42/75");
    expect(
      toolOutcome("compare_titles", JSON.stringify({ candidates: [{}, {}, {}] })),
    ).toBe("3 compared");
    expect(
      toolOutcome("check_continuing_series", JSON.stringify({ watching: [{}, {}] })),
    ).toBe("2 shows in progress");
    expect(
      toolOutcome("check_continuing_series", JSON.stringify({ watching: [] })),
    ).toBe("nothing in progress");
    expect(
      toolOutcome("get_episode_recap", JSON.stringify({ progress: "42/75" })),
    ).toBe("caught up to 42/75");
  });

  it("treats the taste profile's prose result as success", () => {
    expect(toolOutcome("get_taste_profile", "You love slow-burn thrillers…")).toBe(
      "profile ready",
    );
  });

  it("reports errors gently and never leaks raw JSON", () => {
    expect(toolOutcome("search_tmdb", JSON.stringify({ error: "boom" }))).toBe("hit a snag");
    // Write tools are narrated by their receipts, not an outcome digest.
    expect(
      toolOutcome("add_to_library", JSON.stringify({ saved: true, title: "Dune" })),
    ).toBeUndefined();
  });
});

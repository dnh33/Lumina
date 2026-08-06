import { describe, it, expect } from "vitest";
import {
  deriveGuidedStage,
  eraBandFromDecade,
  genreGuidedResumePath,
  genreSelfEnterPath,
  hasGuidedSessionProgress,
  resolveGuidedEraChoice,
} from "./guidedStage.js";

describe("deriveGuidedStage deepenOpen", () => {
  const complete = {
    isSeedWorld: false,
    answeredCount: 3,
    totalBeats: 3,
    status: "complete" as const,
    widenBrowse: false,
  };

  it("complete + deepenOpen → deepen", () => {
    expect(deriveGuidedStage({ ...complete, deepenOpen: true })).toBe("deepen");
  });

  it("complete + deepen closed → claim", () => {
    expect(deriveGuidedStage({ ...complete, deepenOpen: false })).toBe("claim");
    expect(deriveGuidedStage(complete)).toBe("claim");
  });

  it("widenBrowse wins over deepenOpen", () => {
    expect(
      deriveGuidedStage({
        ...complete,
        widenBrowse: true,
        deepenOpen: true,
      }),
    ).toBe("browse");
  });
});

describe("genre enter / resume paths", () => {
  it("cold Enter stays Self; Resume is explicit Guided", () => {
    expect(genreSelfEnterPath("horror")).toBe("/genre/horror?mode=self");
    expect(genreGuidedResumePath("horror")).toBe("/genre/horror?mode=guided");
  });
});

describe("hasGuidedSessionProgress", () => {
  it("hides fresh empty shells", () => {
    expect(
      hasGuidedSessionProgress({
        status: "active",
        answers: {},
        acted: [],
      }),
    ).toBe(false);
  });

  it("shows when dials, acts, or complete", () => {
    expect(
      hasGuidedSessionProgress({
        status: "active",
        answers: { tempo: "slow" },
        acted: [],
      }),
    ).toBe(true);
    expect(
      hasGuidedSessionProgress({
        status: "active",
        answers: {},
        acted: [{ tmdbId: 1 }],
      }),
    ).toBe(true);
    expect(
      hasGuidedSessionProgress({
        status: "complete",
        answers: {},
        acted: [],
      }),
    ).toBe(true);
  });
});

describe("eraBandFromDecade", () => {
  it("maps Self decades onto classic / turn / now", () => {
    expect(eraBandFromDecade(1980)).toBe("classic");
    expect(eraBandFromDecade(1970)).toBe("classic");
    expect(eraBandFromDecade(1990)).toBe("turn");
    expect(eraBandFromDecade(2000)).toBe("turn");
    expect(eraBandFromDecade(2010)).toBe("now");
    expect(eraBandFromDecade(2020)).toBe("now");
  });

  it("ignores empty / unknown scrub", () => {
    expect(eraBandFromDecade(null)).toBeUndefined();
    expect(eraBandFromDecade(undefined)).toBeUndefined();
    expect(eraBandFromDecade(0)).toBeUndefined();
  });
});

describe("resolveGuidedEraChoice", () => {
  it("Self decade preferred fills only when session era unanswered", () => {
    expect(
      resolveGuidedEraChoice({
        sessionEra: undefined,
        preferredFromSelf: "classic",
      }),
    ).toBe("classic");
  });

  it("does not wipe a completed / retuned session era", () => {
    expect(
      resolveGuidedEraChoice({
        sessionEra: "now",
        preferredFromSelf: "classic",
      }),
    ).toBe("now");
  });
});

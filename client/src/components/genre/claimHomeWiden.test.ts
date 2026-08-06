import { describe, it, expect } from "vitest";
import {
  clearWidenOnModeFlip,
  resolveGuidedWidenOnClaimHome,
} from "./claimHomeWiden.js";

describe("resolveGuidedWidenOnClaimHome", () => {
  it("collapses sticky widen on Guided remount without intent (claim home)", () => {
    // complete session + widen true + remount → claim / no browse until Widen
    expect(
      resolveGuidedWidenOnClaimHome({ widenIntentThisSession: false }),
    ).toBe(false);
  });

  it("keeps widen when user just clicked Widen this Guided visit", () => {
    expect(
      resolveGuidedWidenOnClaimHome({ widenIntentThisSession: true }),
    ).toBe(true);
  });
});

describe("clearWidenOnModeFlip", () => {
  it("Guided→Self→Guided seam clears widen and intent", () => {
    expect(clearWidenOnModeFlip()).toEqual({
      guidedWiden: false,
      widenIntent: false,
    });
  });
});

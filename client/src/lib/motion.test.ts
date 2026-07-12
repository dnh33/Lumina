import { describe, expect, it } from "vitest";
import { EASE_OUT_EXPO, EASE_STATE, stagger60 } from "./motion";

describe("motion foundation", () => {
  it("exposes the two signature easing curves as bezier tuples", () => {
    expect(EASE_OUT_EXPO).toEqual([0.22, 1, 0.36, 1]);
    expect(EASE_STATE).toEqual([0.4, 0, 0.2, 1]);
  });

  it("stagger60 uses the 60ms baseline stagger (R4)", () => {
    expect(stagger60.show.transition.staggerChildren).toBe(0.06);
  });
});

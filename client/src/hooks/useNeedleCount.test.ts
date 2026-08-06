import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const reduceMotion = vi.fn(() => false);

vi.mock("framer-motion", () => ({
  useReducedMotion: () => reduceMotion(),
}));

import { useNeedleCount } from "./useNeedleCount.js";

describe("useNeedleCount", () => {
  beforeEach(() => {
    reduceMotion.mockReturnValue(false);
    // jsdom does not pump rAF; bridge to timers so the needle can settle.
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) =>
        setTimeout(() => cb(performance.now()), 16) as unknown as number,
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });
  afterEach(() => {
    reduceMotion.mockReturnValue(false);
    vi.unstubAllGlobals();
  });

  it("settles on the target after the needle duration", async () => {
    const { result } = renderHook(() => useNeedleCount(40, 120));
    expect(result.current).toBe(0);
    await waitFor(() => expect(result.current).toBe(40), { timeout: 1000 });
  });

  it("returns the target immediately when reduced motion is on", () => {
    reduceMotion.mockReturnValue(true);
    const { result } = renderHook(() => useNeedleCount(40, 780));
    expect(result.current).toBe(40);
  });

  it("returns undefined when target is undefined", () => {
    const { result } = renderHook(() => useNeedleCount(undefined));
    expect(result.current).toBeUndefined();
  });
});

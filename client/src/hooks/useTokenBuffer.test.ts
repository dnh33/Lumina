import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { bufferFlush, useTokenBuffer } from "./useTokenBuffer";

describe("bufferFlush (pure helper, T6)", () => {
  it("concatenates buffered deltas in order", () => {
    expect(bufferFlush(["a", "b", "c"])).toBe("abc");
  });

  it("returns empty string for an empty buffer", () => {
    expect(bufferFlush([])).toBe("");
  });
});

describe("useTokenBuffer (T6)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes once near ~24ms with all deltas concatenated", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useTokenBuffer(onFlush, 24));

    // deltas arrive at t=0,5,10,15ms
    act(() => result.current.push("**bold**"));
    act(() => {
      vi.advanceTimersByTime(5);
      result.current.push(" and ");
    });
    act(() => {
      vi.advanceTimersByTime(5);
      result.current.push("## h");
    });
    act(() => {
      vi.advanceTimersByTime(5);
      result.current.push("eading");
    });

    // Not yet flushed (interval is 24ms, timer started at t=0).
    expect(onFlush).not.toHaveBeenCalled();

    // advance to just past the 24ms cadence → exactly one flush
    act(() => {
      vi.advanceTimersByTime(9);
    });

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith("**bold** and ## heading");
  });

  it("exposes the latest flushed text in state", () => {
    const { result } = renderHook(() => useTokenBuffer(undefined, 24));
    expect(result.current.text).toBe("");

    act(() => {
      result.current.push("hello");
      vi.advanceTimersByTime(24);
    });

    expect(result.current.text).toBe("hello");
  });

  it("accumulates across multiple flush cadences (does not replace)", () => {
    const onFlush = vi.fn();
    const { result } = renderHook(() => useTokenBuffer(onFlush, 24));

    act(() => {
      result.current.push("Hello");
      vi.advanceTimersByTime(24);
    });
    expect(result.current.text).toBe("Hello");
    expect(onFlush).toHaveBeenLastCalledWith("Hello");

    act(() => {
      result.current.push(" world");
      vi.advanceTimersByTime(24);
    });
    expect(result.current.text).toBe("Hello world");
    expect(onFlush).toHaveBeenLastCalledWith("Hello world");
  });

  it("reset clears buffered text", () => {
    const { result } = renderHook(() => useTokenBuffer(undefined, 24));
    act(() => {
      result.current.push("partial");
      result.current.reset();
    });
    expect(result.current.text).toBe("");
  });
});

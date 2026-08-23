import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHaptics } from "./useHaptics";

describe("useHaptics", () => {
  afterEach(() => {
    // restore any deleted vibrate so we don't leak state into other suites
    if (!("vibrate" in navigator)) {
      (navigator as any).vibrate = vi.fn();
    }
  });

  it("calls navigator.vibrate with the default duration when supported", () => {
    const spy = vi.fn();
    (navigator as any).vibrate = spy;
    const { result } = renderHook(() => useHaptics());
    result.current();
    expect(spy).toHaveBeenCalledWith(10);
  });

  it("passes a custom duration through", () => {
    const spy = vi.fn();
    (navigator as any).vibrate = spy;
    const { result } = renderHook(() => useHaptics());
    result.current(30);
    expect(spy).toHaveBeenCalledWith(30);
  });

  it("is a silent no-op when vibrate is unsupported (iOS Safari)", () => {
    const original = (navigator as any).vibrate;
    delete (navigator as any).vibrate;
    const { result } = renderHook(() => useHaptics());
    expect(() => result.current()).not.toThrow();
    if (original) (navigator as any).vibrate = original;
  });
});

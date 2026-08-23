import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePullToRefresh } from "./usePullToRefresh";

function makeEls() {
  const scroll = document.createElement("div");
  const content = document.createElement("div");
  scroll.appendChild(content);
  Object.defineProperty(scroll, "scrollTop", { value: 0, writable: true });
  return { scroll, content };
}

function fireTouch(
  el: HTMLElement,
  type: string,
  clientY: number,
  preventDefault = () => {},
) {
  const e = new Event(type, { bubbles: true }) as any;
  e.touches = [{ clientY }];
  e.preventDefault = preventDefault;
  el.dispatchEvent(e);
  return e;
}

describe("usePullToRefresh", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("fires onRefresh when released past the threshold at scrollTop 0", async () => {
    const { scroll, content } = makeEls();
    document.body.appendChild(scroll);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const scrollRef = { current: scroll } as any;
    const contentRef = { current: content } as any;

    renderHook(() =>
      usePullToRefresh({ scrollRef, contentRef, onRefresh }),
    );

    // touchstart at top, pull down 220px raw (>72 threshold after 0.5 resistance)
    fireTouch(scroll, "touchstart", 100);
    fireTouch(scroll, "touchmove", 320);
    fireTouch(scroll, "touchend", 320);

    // onRefresh is async; allow microtasks to flush
    await new Promise((r) => setTimeout(r, 0));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when the list is scrolled away from the top", async () => {
    const { scroll, content } = makeEls();
    document.body.appendChild(scroll);
    scroll.scrollTop = 80; // mid-list
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const scrollRef = { current: scroll } as any;
    const contentRef = { current: content } as any;

    renderHook(() =>
      usePullToRefresh({ scrollRef, contentRef, onRefresh }),
    );

    fireTouch(scroll, "touchstart", 100);
    fireTouch(scroll, "touchmove", 300);
    fireTouch(scroll, "touchend", 300);

    await new Promise((r) => setTimeout(r, 0));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("does NOT fire when released before the threshold", async () => {
    const { scroll, content } = makeEls();
    document.body.appendChild(scroll);
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const scrollRef = { current: scroll } as any;
    const contentRef = { current: content } as any;

    renderHook(() =>
      usePullToRefresh({ scrollRef, contentRef, onRefresh }),
    );

    fireTouch(scroll, "touchstart", 100);
    fireTouch(scroll, "touchmove", 130); // dy=30, well under 72
    fireTouch(scroll, "touchend", 130);

    await new Promise((r) => setTimeout(r, 0));
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

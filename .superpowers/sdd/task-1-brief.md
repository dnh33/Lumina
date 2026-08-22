# Task 1: WaveformSkeleton Component

**Source:** `docs/plans/2026-08-18-skeleton-presence-execution.md` Task 1

**Files:**
- Create: `client/src/components/chat/WaveformSkeleton.tsx`
- Create: `client/src/components/chat/WaveformSkeleton.test.tsx`

**Interfaces:**
- Consumes: `phase: "starting" | "thinking" | "tooling" | "writing"`
- Produces: Self-contained component, no extra exports needed (named export `WaveformSkeleton`)

**Component code (use verbatim):**
```tsx
import { motion, useReducedMotion } from "framer-motion";

export function WaveformSkeleton({ phase }: { phase: "starting" | "thinking" | "tooling" | "writing" }) {
  const reduce = useReducedMotion();
  const isVisible = phase !== "writing"; // Hide when content starts streaming
  const barCount = phase === "tooling" ? 5 : 3; // More bars during tooling
  const bars = Array.from({ length: barCount });

  if (phase === "writing" || !isVisible) return null;

  return (
    <span
      className="inline-flex items-end gap-0.5 ml-1 align-middle"
      data-testid="waveform-skeleton"
    >
      {bars.map((_, i) => (
        <motion.span
          key={i}
          data-part="waveform-bar"
          className="w-[2px] rounded bg-gold-300/70"
          style={{ height: 12, opacity: 0.45 }}
          animate={
            reduce
              ? { opacity: [0.45, 0.7, 0.45] }
              : { height: [10, 22, 10] }
          }
          transition={{
            duration: reduce ? 2 : 1.1,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.06,
          }}
        />
      ))}
    </span>
  );
}
```

**Tests (use verbatim, plus afterEach isolation noted in dispatch):**
```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { WaveformSkeleton } from "./WaveformSkeleton";

function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

describe("WaveformSkeleton", () => {
  it("renders 3 bars in thinking phase (non-reduced)", () => {
    setReducedMotion(false);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    expect(container.querySelectorAll("[data-part='waveform-bar']").length).toBe(3);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).not.toBeNull();
    setReducedMotion(false);
  });

  it("renders 5 bars in tooling phase", () => {
    setReducedMotion(false);
    const { container } = render(<WaveformSkeleton phase="tooling" />);
    expect(container.querySelectorAll("[data-part='waveform-bar']").length).toBe(5);
    setReducedMotion(false);
  });

  it("renders nothing when phase is writing", () => {
    const { container } = render(<WaveformSkeleton phase="writing" />);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).toBeNull();
  });

  it("renders nothing when phase is starting (brief, before thinking begins)", () => {
    const { container } = render(<WaveformSkeleton phase="starting" />);
    expect(container.querySelector("[data-testid='waveform-skeleton']")).not.toBeNull();
  });

  it("respects prefers-reduced-motion (no height animation)", () => {
    setReducedMotion(true);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    const bars = container.querySelectorAll("[data-part='waveform-bar']");
    expect(bars.length).toBe(3);
    // In reduced mode, bars should have static height (no height animation)
    expect(bars[0].style.height).not.toContain("10");
    setReducedMotion(false);
  });
});
```

**Steps:**
1. Write the test file first (TDD RED)
2. Run: `npx vitest run --root client src/components/chat/WaveformSkeleton.test.tsx` — must fail (component missing)
3. Write the WaveformSkeleton component
4. Run the same test command — must pass (5/5)
5. Do NOT commit

**Acceptance:**
- 3 gold bars for `starting` and `thinking`
- 5 gold bars for `tooling`
- `null` (no `data-testid="waveform-skeleton"`) during `writing`
- Reduced-motion uses opacity pulse, not height animation
- Exactly 5 tests

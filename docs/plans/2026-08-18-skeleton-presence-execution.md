# Lumina Companion Chat — Skeleton + Presence Execution Plan (Phase 2)

> **For agentic workers:** REQUIRED — use cursor-cli subagent or execute inline. Steps use checkbox (`- [ ]`) for tracking.
>
> **Spec:** `docs/plans/2026-08-05-anti-slop-facelift-design-spec.md` §4.2 Companion + §5 Motion
>
> **Pre-req:** Phase 1 (fence guard) is shipped and verified. This is Phase 2 — skeleton UI + presence polish.
>
> **Gate note:** Skeleton UI is additive (uses existing components). Error recovery contract is additive (extends existing error state). Neither touches `theme.css` tokens or new visual language — Gate W not needed for these tasks.

**Goal:** Replace `<p>Thinking…</p>` + blinking caret with a phase-driven skeleton (SparkAvatar ripples + ToolRibbon + waveform bars), add error recovery contract (partial preservation + contextual retry), and implement the welcome value-proof state.

**Architecture:** `ChatThread.tsx` → `AssistantTurn` has access to `stream?.phase` (starting/thinking/tooling/writing) and `stream.steps` (ToolStep[]). `useChat` returns `companionState` and `isStreaming`. All needed data is already available — we just need to wire it.

**Tech Stack:** React 19 + Vite + Tailwind 4 + Framer Motion. Tests via Vitest + Testing Library (jsdom). Typecheck: `npx tsc --noEmit --project client/tsconfig.json`. Tests: `npx vitest run --root client src/components/chat/`.

---

## Task 1: WaveformSkeleton Component

**Files:**
- Create: `client/src/components/chat/WaveformSkeleton.tsx`
- Create: `client/src/components/chat/WaveformSkeleton.test.tsx`

**Interfaces:**
- Consumes: `phase: "starting" | "thinking" | "tooling" | "writing"`
- Produces: Self-contained component, no exports needed

**Code:**
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

**Tests:**
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

- [ ] **Step 1: Write the test file**
- [ ] **Step 2: Run test to verify it fails** — `npx vitest run --root client src/components/chat/WaveformSkeleton.test.tsx`
- [ ] **Step 3: Write the WaveformSkeleton component**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit** — `feat: add waveform skeleton component for streaming phases`

---

## Task 2: Phase-Driven Skeleton in AssistantTurn

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:99-149` (AssistantTurn component)
- Modify: `client/src/components/chat/MessageBubble.tsx` (imports)
- Create: `client/src/components/chat/ChatThread.test.tsx` (integration tests)

**Current code (line 133-135):**
```tsx
{thinking && !content ? (
  <p className="text-[0.8rem] italic text-mist-300">Thinking…</p>
) : (
  <MessageBubble ... />
)}
```

**New code:**
```tsx
{thinking && !content ? (
  <div className="flex items-center gap-2 text-[0.85rem] text-mist-300">
    <SparkAvatar state={companionState} hideWhisper />
    <span>{phaseLabel(stream?.phase ?? "thinking")}</span>
    <WaveformSkeleton phase={stream?.phase ?? "thinking"} />
  </div>
) : (
  <MessageBubble ... />
)}
```

**phaseLabel helper:**
```tsx
function phaseLabel(phase: TurnPhase): string {
  switch (phase) {
    case "starting": return "Lumina is waking…";
    case "thinking": return "Lumina is thinking…";
    case "tooling": return "Reaching into your library…";
    case "writing": return "Composing…";
    default: return "Lumina is thinking…";
  }
}
```

**Need to import:** `WaveformSkeleton` + `TurnPhase` type into ChatThread.tsx

- [ ] **Step 1: Write failing integration test** — skeleton visible during thinking, hidden when content arrives
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add phaseLabel + WaveformSkeleton to AssistantTurn**
- [ ] **Step 4: Run tests** — `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
- [ ] **Step 5: Commit** — `feat: phase-driven skeleton replaces Thinking… text`

---

## Task 3: Error Recovery Contract

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:472-485` (error block)
- Test: Extend `ChatThread.test.tsx`

**Current error block (line 472-485):**
```tsx
{error && (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25">
    <p className="text-sm text-red-300">{error}</p>
    {failedText && !isStreaming && (
      <button type="button" className="btn-ghost shrink-0" onClick={() => void send(failedText)}>
        Retry
      </button>
    )}
  </div>
)}
```

**New error recovery contract:**
- Show partial content (stream.assistantText) preserved on screen
- Error block shows: "Lumina was interrupted — the partial response above is preserved. Send again?" with two options:
  - **Retry** (resend failedText)
  - **Start fresh** (clear and new conversation)
- If no partial content, show: "Something went wrong. Try again?" with Retry + Start fresh

```tsx
{error && (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25">
    <div className="flex flex-col gap-1">
      <p className="text-sm text-red-300">
        {stream?.assistantText && stream.assistantText.length > 0
          ? "Lumina was interrupted — the response above is preserved. Try again?"
          : "Something went wrong. Try again?"}
      </p>
      {stream?.assistantText && stream.assistantText.length > 0 && (
        <p className="text-2xs text-mist-400/70">The partial response above is safe — no data lost.</p>
      )}
    </div>
    {failedText && !isStreaming && (
      <div className="flex gap-2">
        <button type="button" className="btn-ghost btn-sm" onClick={() => void send(failedText)}>
          Retry
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setStream(null)}>
          Start fresh
        </button>
      </div>
    )}
  </div>
)}
```

**Also fix:** The `SparkAvatar` error state needs to show the error. Currently `SparkAvatar` has an `error` state with `FaultLine`. Make sure `AssistantTurn` passes `companionState="error"` when there's an error:

```tsx
// In AssistantTurn, add error state to SparkAvatar:
<SparkAvatar state={error ? "error" : (companionState ?? "idle")} hideWhisper />
```

- [ ] **Step 1: Write test** — error block shows partial preservation message
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Implement error recovery contract**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `feat: error recovery contract with partial preservation + contextual retry`

---

## Task 4: Welcome Value-Proof State

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:369-401` (welcome block)
- Test: Extend `ChatThread.test.tsx`

**Current welcome (line 369-401):** Shows `SparkAvatar` + greeting + generic "I know every title..." message.

**New welcome:** If `dormant` — show memory constellation line + "I kept your slow-burn list warm." If not dormant — show **dealt-in posters** (P0 from design spec §4.2: Companion welcome = dealt-in posters ≥3).

Since we can't fetch posters in the skeleton phase (no real data), this task focuses on the structure: the welcome block should accept a `welcomePosters` prop (array of poster URLs) and render them. If empty, fall back to the current text-only welcome.

**For now (Phase 2 scope):** Just ensure the welcome block renders the SparkAvatar with `idle` state + the existing greeting + the dormant memory constellation line. The poster integration comes later when the backend serves watched-history posters.

- [ ] **Step 1: Verify welcome block renders SparkAvatar idle**
- [ ] **Step 2: Verify dormant path shows memory constellation**
- [ ] **Step 3: Add `welcomePosters` prop to ChatThread Props (optional, future-use)**
- [ ] **Step 4: Commit** — `feat: welcome state structure with dealt-in poster slot (P0 from design spec)`

---

## Task 5: SparkAvatar Presence Polish

**Files:**
- Modify: `client/src/components/chat/SparkAvatar.tsx` (breathing idle, caret trail)
- Extend: `client/src/components/chat/SparkAvatar.test.tsx`

**Changes:**

### 5a: Breathing idle (add opacity pulse)
```tsx
// Line 269 — add opacity to idle coreAnimate
case "idle":
  return { 
    scale: [1, 1.035, 1],
    opacity: [0.88, 1, 0.88] // SUBTLE breath
  };
// Transition stays { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
```

### 5b: Gold caret trail on writing state
The `Comet` component (line 163-194) already animates along the star path. Add a trailing glow element:
```tsx
// In Comet(), add after the existing motion.span:
<motion.span
  data-part="caret-trail"
  className="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 rounded"
  style={{
    background: GOLD,
    boxShadow: `0 0 4px ${GOLD}`,
  }}
  // Animate boxShadow based on cadence MotionValue
  {...(reduce
    ? { opacity: 0.6 }
    : {
        boxShadow: [
          `0 0 4px ${GOLD}`,
          `0 0 12px ${GOLD}, 0 0 8px ${GOLD_SOFT}`,
          `0 0 4px ${GOLD}`,
        ],
      })}
  animate={reduce ? { opacity: 0.6 } : undefined}
  transition={reduce ? { duration: 0.2 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
/>
```

Wait — `useMotionValue` is already imported and `cadence` exists in Comet. But we can't use `cadence` in a second `animate` call — Framer Motion doesn't support deriving `boxShadow` from a MotionValue via inline `animate`. Instead, use `useTransform`:

```tsx
// In Comet(), after cadence MotionValue:
const trailGlow = useTransform(cadence, [0, 1], [`0 0 4px ${GOLD}`, `0 0 16px ${GOLD}, 0 0 10px ${GOLD_SOFT}`]);

// Then use trailGlow in the style:
<motion.span
  data-part="caret-trail"
  className="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 rounded"
  style={{
    background: GOLD,
    boxShadow: trailGlow,
  }}
/>
```

### 5c: Error pulse (not shake)
Error state already has `FaultLine` + `data-shake="false"`. Add a subtle opacity pulse:

```tsx
// Line 313 — add pulse animation for error state
style={{
  width: size,
  height: size,
  filter: state === "error" ? "grayscale(0.85)" : glow?.filter,
  animation: (!reduce && state === "error") ? "error-pulse 2.4s ease-in-out infinite" : undefined,
}}
```

Add CSS to `theme.css` (safe — new keyframe, not a token):
```css
@keyframes error-pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
```

- [ ] **Step 1: Write tests** for breathing idle + caret-trail + error pulse
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Implement all three changes**
- [ ] **Step 4: Run `npx vitest run --root client src/components/chat/SparkAvatar.test.tsx`**
- [ ] **Step 5: Commit** — `feat: SparkAvatar breathing idle, gold caret trail, error pulse`

---

## Task 6: Full Integration Verification

- [ ] Run `npx tsc --noEmit --project client/tsconfig.json` — must be clean
- [ ] Run `npx vitest run --root client src/components/chat/` — must be ≥48 passing (original) + new tests
- [ ] Run `npx vitest run --root client src/components/genre/` — verify still only 2 pre-existing failures
- [ ] Verify no `.worktrees/` contamination (vitest config fix already applied)

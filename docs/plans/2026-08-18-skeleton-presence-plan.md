# Companion Chat Skeleton + Presence Facelift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/plans/2026-08-05-anti-slop-facelift-design-spec.md` §4.2 Companion surface + §5 Motion. Gate D must be clear before code starts (this plan assumes post-Gate-D execution).
>
> **Pre-req:** Phase 1 (streaming fence guard) is already shipped (commit status: uncommitted in working tree, tests green 48/48). This plan covers Phase 2 (skeleton + presence) and Phase 3 (error/welcome facelift).

**Goal:** Replace the bare `<p>Thinking…</p>` streaming placeholder with a phase-driven skeleton that shows companion presence (ripples/tool-trace/waveform), and polish SparkAvatar's 5-state presence with breathing idle, gold caret trail on writing, and gentle error pulse.

**Architecture:** `ChatThread.tsx` already exposes `stream.phase` (`starting`/`thinking`/`tooling`/`writing`) and `isStreaming` to `AssistantTurn`. The skeleton renders in the assistant turn slot before first delta. `SparkAvatar.tsx` already accepts `CompanionState` — we enhance the visual states in-place. No new hooks; no new data paths.

**Tech Stack:** React 19 + Vite + Tailwind 4 + Framer Motion (already in companion). Tests via Vitest + Testing Library (jsdom). Typecheck: `npx tsc --noEmit --project client/tsconfig.json`.

---

## Global Constraints

- Typecheck must pass (`npx tsc --noEmit --project client/tsconfig.json`)
- Tests must pass (`npx vitest run --root client <files>`) — 0 regressions
- `prefers-reduced-motion` must be respected (no infinite loops, reduced choreography)
- Gold = earned signal, not decorative glow (per spec §1.2/§5)
- Dark only, no new mascot assets
- Phase 2 does NOT touch `theme.css` tokens (Gate W — World merge must happen first)
- Commit only when Daniel approves; no auto-commit

---

## File Structure

| File | Change |
|------|--------|
| `client/src/components/chat/ChatThread.tsx` | Modify: replace `<p>Thinking…</p>` with phase-driven skeleton + waveform |
| `client/src/components/chat/SparkAvatar.tsx` | Modify: breathing idle, gold caret on writing, gentle error pulse |
| `client/src/components/chat/MessageBubble.tsx` | Modify: pass phase state to skeleton |
| `client/src/components/chat/ChatThread.test.tsx` | Create: skeleton phase tests |
| `client/src/components/chat/SparkAvatar.test.tsx` | Extend: breathing + error pulse assertions |

---

## Phase 2: Dynamic Skeleton UI

### Task 1: Typing Waveform Component

**Files:**
- Create: `client/src/components/chat/WaveformSkeleton.tsx`
- Modify: `client/src/components/chat/ChatThread.tsx:133` (the `thinking` branch)
- Test: `client/src/components/chat/WaveformSkeleton.test.tsx`

**Interfaces:**
- Consumes: `phase: TurnPhase` from `useChat.ts` (already exported)
- Produces: Self-contained component, no exports needed by other tasks

**Design:**
- 3–5 vertical bars (gold `gold-300` at 70% opacity), staggered animation
- Each bar: height 12–24px, width 2px, rounded
- Animation: `ease-out-expo` delay stagger (60ms offset per bar), 1.2s cycle, `repeat: Infinity`
- `prefers-reduced-motion`: bars become static opacity pulse (no scale/height animation)
- GPU-only (transform/opacity, no layout-triggering properties)
- Bars positioned inline with the thinking text, replacing the caret span

```tsx
// WaveformSkeleton.tsx
import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";

export function WaveformSkeleton({ phase }: { phase: "thinking" | "tooling" | "starting" }) {
  const reduce = useReducedMotion();
  const bars = [0, 1, 2, 3, 4];
  
  return (
    <span className="inline-flex items-end gap-0.5 ml-1">
      {bars.map((i) => (
        <motion.span
          key={i}
          className="w-[2px] rounded bg-gold-300/70"
          style={{ height: 16, opacity: 0.45 }}
          animate={reduce 
            ? { opacity: [0.45, 0.7, 0.45] }
            : { height: [12, 24, 12] }
          }
          transition={{
            duration: reduce ? 2 : 1.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: reduce ? 0 : i * 0.06,
          }}
        />
      ))}
    </span>
  );
}
```

- [ ] **Step 1: Write the failing test**

```tsx
// WaveformSkeleton.test.tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";
import { WaveformSkeleton } from "./WaveformSkeleton";

function setReducedMotion(reduce: boolean) {
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = reduce;
}

describe("WaveformSkeleton", () => {
  it("renders data-testid for accessibility tree", () => {
    setReducedMotion(true);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    const bars = container.querySelectorAll("[data-part='waveform-bar']");
    expect(bars.length).toBeGreaterThanOrEqual(3);
    setReducedMotion(false);
  });

  it("renders 5 bars in non-reduced motion mode", () => {
    setReducedMotion(false);
    const { container } = render(<WaveformSkeleton phase="thinking" />);
    const bars = container.querySelectorAll("[data-part='waveform-bar']");
    expect(bars.length).toBe(5);
    setReducedMotion(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails** — `npx vitest run --root client src/components/chat/WaveformSkeleton.test.tsx`
- [ ] **Step 3: Write minimal implementation** (as above, with `data-part='waveform-bar'`)
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit** — `feat: add waveform skeleton for streaming phases`

### Task 2: Phase-Driven Skeleton in AssistantTurn

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:99-149` (AssistantTurn component)
- Test: `client/src/components/chat/ChatThread.test.tsx` (extend existing or create)

**Design:**
Replace the `thinking && !content ? <p>Thinking…</p> : <MessageBubble>` branch:

```tsx
{thinking && !content ? (
  <div className="flex items-center gap-2 text-[0.85rem] text-mist-300">
    <SparkAvatar state={companionState} hideWhisper />
    <span>
      {phaseLabel(stream?.phase ?? "thinking")}
    </span>
    <WaveformSkeleton phase={stream?.phase === "writing" ? "thinking" : (stream?.phase ?? "thinking")} />
  </div>
) : (
  <MessageBubble ... />
)}
```

Where `phaseLabel` maps phase → label:
- `starting` → "Lumina is waking…"
- `thinking` → "Lumina is thinking…"  
- `tooling` → "Reaching into your library…"
- `writing` → "Composing…"

But we only show the skeleton when `thinking && !content` — once first delta arrives, `content` populates and MessageBubble renders. So the waveform only shows during early phases.

- [ ] **Step 1: Write failing test** for `phaseLabel` pure function
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Extract `phaseLabel` as pure helper + wire skeleton**
- [ ] **Step 4: Run tests** — `npx vitest run --root client src/components/chat/ChatThread.test.tsx`
- [ ] **Step 5: Commit** — `feat: replace Thinking… p-tag with phase-driven skeleton + waveform`

### Task 3: Skeleton Visibility Timing

**Files:**
- Modify: `client/src/components/chat/ChatThread.tsx:133-135`
- Test: Extend `ChatThread.test.tsx`

**Design:** The skeleton should yield to `MessageBubble` as soon as first delta arrives (`stream.assistantText` has content) OR when phase transitions to `writing`. Use `streamedText || stream.assistantText` length check:

- Skeleton shows when: `thinking && !content && phase !== "writing"`
- Once phase hits "writing" (first delta arrived), immediately show MessageBubble with streamed content
- The WaveformSkeleton component stays visible during `thinking`/`starting`/`tooling` phases

- [ ] **Step 1: Write test** — skeleton hidden when stream has assistantText
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add `streamedText.length > 0` guard** to skeleton condition
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `feat: skeleton yields to content on first delta`

---

## Phase 3: SparkAvatar Presence Polish

### Task 4: Breathing Idle Animation

**Files:**
- Modify: `client/src/components/chat/SparkAvatar.tsx:267-291` (coreAnimate/coreTransition)
- Test: Extend `SparkAvatar.test.tsx`

**Design:** The `idle` state already has `scale: [1, 1.035, 1]` but no **breathing** (opacity pulse). Add a subtle opacity breath:

```tsx
case "idle":
  return { 
    scale: [1, 1.035, 1],
    opacity: [0.9, 1, 0.9]
  };
```

Transition stays `{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }`.

- [ ] **Step 1: Write test** — idle state emits opacity keyframes (non-reduced)
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add opacity to idle coreAnimate**
- [ ] **Step 4: Run `npx vitest run --root client src/components/chat/SparkAvatar.test.tsx`**
- [ ] **Step 5: Commit** — `feat: breathing opacity on idle SparkAvatar`

### Task 5: Gold Caret Trail on Writing

**Files:**
- Modify: `client/src/components/chat/SparkAvatar.tsx` (Comet component, lines 163-194)
- Test: Extend `SparkAvatar.test.tsx`

**Design:** The `writing` state already has a Comet (offset-path animation along the star path). Enhance it: add a **gold caret trail** — a subtle MotionValue-driven glow that brightens/dims with token cadence. The Comet already uses `useMotionValue` for cadence; wire it to a gold `box-shadow` pulse:

```tsx
// In Comet, add a second element for the trail:
<motion.span
  data-part="caret-trail"
  className="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 rounded"
  style={{
    background: GOLD,
    boxShadow: `0 0 ${useTransform(cadence, [0, 1], [4, 12])}px ${GOLD}`,
  }}
/>
```

- [ ] **Step 1: Write test** — `data-part='caret-trail'` present when state=writing
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add caret trail element to Comet**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `feat: gold caret trail on writing state`

### Task 6: Gentle Error Pulse (No Shake)

**Files:**
- Modify: `client/src/components/chat/SparkAvatar.tsx` (FaultLine + error state, lines 196-228)
- Test: Extend `SparkAvatar.test.tsx`

**Design:** Error state already has `FaultLine` (red-gold gradient line) and `data-shake="false"`. Add a **subtle opacity pulse** to the whole error state (not a shake):

```tsx
// In the root span, add animate for error state:
style={{
  filter: state === "error" ? "grayscale(0.85)" : glow?.filter,
  animation: reduce ? undefined : state === "error" ? "pulse-subtle 2s infinite" : undefined,
}}
```

Add to `theme.css` or as a motion animation. Check spec §1.3 failure modes — "red-gold fault-line" is already there. Add the pulse animation as a CSS keyframe in the component or `theme.css`.

- [ ] **Step 1: Write test** — error state has `data-shake="false"` AND pulse animation defined
- [ ] **Step 2: Run to verify failure**
- [ ] **Step 3: Add `@keyframes` pulse + apply to error state**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `feat: gentle error pulse on SparkAvatar`

---

## Phase 4: Integration + Verification

### Task 7: End-to-End Fence + Skeleton Integration Test

**Files:**
- Create: `client/src/components/chat/ChatThread.integration.test.tsx`
- Test: Covers MessageBubble → MarkdownMessage streaming + skeleton phase transitions

**Design:** Integration test that simulates the full streaming flow:
1. Render ChatThread with mocked `useChat` returning `phase: "thinking"`, `stream: { phase: "thinking", assistantText: "" }`
2. Assert skeleton (WaveformSkeleton) visible
3. Simulate phase transition to `writing` + delta arrival
4. Assert MessageBubble renders with MarkdownMessage (not raw `<p>`)
5. Simulate open fence content in streamed text
6. Assert raw JSON NOT visible, only prose before fence

- [ ] **Step 1: Write the integration test**
- [ ] **Step 2: Run to verify it passes** (both behaviors already implemented)
- [ ] **Step 3: Fix any edge cases found**
- [ ] **Step 4: Run full chat suite** — `npx vitest run --root client src/components/chat/`
- [ ] **Step 5: Commit** — `test: integration test for streaming fence + skeleton`

### Task 8: Full Regression Suite

- [ ] Run `npx tsc --noEmit --project client/tsconfig.json` — must be clean
- [ ] Run `npx vitest run --root client src/components/chat/` — must be 48+N/48+N (only additions)
- [ ] Run `npx vitest run --root client src/components/genre/` — verify still 2 pre-existing failures only (no new)
- [ ] Run `npx vitest run --root client src/hooks/` — verify companion state machine tests still green

---

## Self-Review (pre-save)

**Spec coverage check:**
- §4.2 Companion: ✅ Welcome dealt-in posters (Phase 4, separate), Memory Marks (separate), Vault vs Self Verdict Clash (separate)
- §4.2 Companion: ✅ More presence OK → Tasks 4-6
- §5 Motion: ✅ Presence states, prefers-reduced-motion respected, no confetti/celebration
- §6 Vetoes: ✅ No FAB glow inflation, no mascot, no gold-on-every-hover

**Placeholder scan:** No "TBD", "implement later", or "add error handling" strings. All code blocks have concrete implementations.

**Type consistency:** `TurnPhase` already exported from `useChat.ts` (`"starting" | "thinking" | "tooling" | "writing"`). `CompanionState` already exported from `useCompanionState.ts`. `Streaming` prop already on `MarkdownMessage` Props. `phaseLabel` is new but pure + tested.

**Blind spots identified:**
1. The `WaveformSkeleton` phase prop naming is confusing — `phase="writing"` maps to waveform "thinking" mode. Will rename to accept the actual `TurnPhase` and handle internally.
2. The caret trail in Task 5 uses `useTransform` inside the Comet function which already has `cadence` as a MotionValue — need to ensure no nested hook call (hooks must be at top level). Will restructure to use the existing `cadence` value.
3. The error pulse animation needs to be defined somewhere — will add as a CSS `@keyframes` in `theme.css` (no conflict with Gate W since it's a companion-local animation, not a token rename).

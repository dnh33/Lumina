# Plan — Lumina's take: loading bloom + honest arrival

**Date:** 2026-07-13
**For Hermes:** Use superpowers + writing-plans to implement task-by-task. Design in `2026-07-13-luminas-take-loading-bloom-design.md`. Each task: write failing test → watch fail → implement → watch pass → commit. Executor is Claude Code CLI via `claude -p` (no `sessions_spawn` in this deployment); orchestrator (you) runs the gates and reads the diff.

**Goal:** Replace the dead `InsightSkeleton` with a living `TakeLoading` SparkAvatar beat + honest arrival reveal on the take surfaces. Client-only, no server.

**Verified primitives (do not guess):**
- `SparkAvatar` — `client/src/components/chat/SparkAvatar.tsx`, props `{ state: CompanionState; hideWhisper?: boolean; size?: number }`. `state="thinking"` → ripples + whisper "considering…". `CompanionState` type from `client/src/hooks/useCompanionState`.
- `messageEnter` / `EASE_OUT_EXPO` — `client/src/lib/motion.ts`.
- `useReducedMotion` — already imported in `TitleDetail.tsx` (`TakeBand`, `InsightCard`).
- RTL setup — `client/src/test/setup.ts` (MemoryRouter available, matchMedia stubbed → no reduced motion by default).
- Existing test style — `client/src/components/InsightBody.test.tsx` (import `render, screen`, `MemoryRouter`, `vi.fn`).
- Edit sites — `TitleDetail.tsx`: `InsightSkeleton` def `:108`; `TakeBand` loading `:207-208`, error `:209-221`; `InsightCard` loading `:296-298`, error `:299-311`; `InsightBody` mount `:224-231` and `:314-320`.

---

## Task 1 — `TakeLoading` component + tests (TDD)
**Objective:** New presentational component for the waiting beat + shared error banner.
**Files:** Create `client/src/components/TakeLoading.tsx`; Create `client/src/components/TakeLoading.test.tsx`.

**Step 1 — write test first** (failing):
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TakeLoading } from "./TakeLoading";

describe("TakeLoading", () => {
  it("shows Lumina's thinking presence with a status live region", () => {
    render(<TakeLoading />);
    // sr-only live region text (mirrors ChatThread)
    expect(screen.getByRole("status")).toHaveTextContent(/reading your taste/i);
    // SparkAvatar renders the brand star with a thinking state label
    expect(screen.getByLabelText(/Lumina is considering/i)).toBeInTheDocument();
    // reserved height kept so the band/card never reflows
    expect(screen.getByRole("status").parentElement).toHaveClass("min-h-[280px]");
  });
});
```
**Step 2:** `cd client && npx vitest run TakeLoading` → FAIL (component missing).
**Step 3 — implement** `TakeLoading.tsx`:
- Root `<div className="min-h-[280px] flex flex-col items-center justify-center gap-3" aria-busy="true">`.
- `<sr-only role="status" aria-live="polite">Lumina is reading your taste</sr-only>`.
- `<SparkAvatar state="thinking" size={40} />`.
- Whisper copy `text-2xs italic text-mist-400` = "reading your taste…".
- Export also a small `TakeErrorBanner({ message, onRetry })` atom: `rounded-xl bg-red-500/10 px-4 py-3 ring-1 ring-red-500/25` + Retry button (reused by Tasks 3).
**Step 4:** `cd client && npx vitest run TakeLoading` → PASS.
**Step 5:** commit (`feat(ui): add TakeLoading beat + TakeErrorBanner atom (tests first)`).

## Task 2 — Wire `TakeLoading` into both surfaces (TDD client)
**Objective:** Replace `InsightSkeleton` in `TakeBand` + `InsightCard` loading branches; no reflow.
**Files:** Edit `client/src/pages/TitleDetail.tsx` (`InsightSkeleton` usages `:208`, `:298`; keep `InsightSkeleton` def removed or left unused — remove if no other use); Add `TakeLoading` import.
**Test:** Add to `TakeLoading.test.tsx` a render guard that the component has no `aria-busy` leak when not loading — OR add a `TitleDetail`-level test stub. Minimal: assert `InsightSkeleton` no longer referenced by grepping; rely on typecheck. If a `TitleDetail` test harness is undesired, instead add a vitest asserting `TakeLoading` renders without throwing under a fake `SparkAvatar` reduced-motion path (setup already stubs matchMedia).
**Implement:** swap `<InsightSkeleton tall />` → `<TakeLoading />`, `<InsightSkeleton />` → `<TakeLoading />`; delete `InsightSkeleton` if now unused (verify no other reference first).
**Verify:** `npx vitest run` + `npm run typecheck`.
**Commit:** `refactor(ui): replace InsightSkeleton with living TakeLoading beat`.

## Task 3 — Honest arrival reveal (TDD client)
**Objective:** `InsightBody` lifts in on resolve with the chat's `messageEnter`.
**Files:** Edit `client/src/pages/TitleDetail.tsx` `InsightBody` wrappers (`:224-231`, `:314-320`); rely on existing `motion.section` + `useReducedMotion`.
**Test:** In `TakeLoading.test.tsx` or a focused `TitleDetail`-arrival test: assert the resolved body container gets `data-arrived` / framer `initial`/`animate` variants referencing `messageEnter`. Keep it light — assert the wrapper uses `variants={messageEnter}` and `initial="hidden" animate="show"` (grep-level or RTL query of a `data-testid`).
**Implement:** wrap the `InsightBody` render in a `motion.div` with `variants={messageEnter} initial={reduceMotion?false:"hidden"} animate="show"`; respect `useReducedMotion()` (already in scope).
**Verify:** `npx vitest run` + `npm run typecheck`.
**Commit:** `feat(ui): take arrives with chat's messageEnter reveal`.

## Task 4 — Error-banner parity (TDD client)
**Objective:** Use `TakeErrorBanner` in both error branches; drop bare red `<p>`.
**Files:** Edit `TitleDetail.tsx` error branches `:209-221`, `:299-311`; import `TakeErrorBanner`.
**Test:** In a small test, render `TakeErrorBanner` with a message + spy `onRetry`; assert message shown and Retry calls handler.
**Implement:** replace the `<div className="flex items-center justify-between…"><p className="text-sm text-red-300/90">…</p><button …>Retry</button></div>` with `<TakeErrorBanner message={…} onRetry={() => insight.refetch() / refresh retry} />`.
**Verify:** `npx vitest run` + `npm run typecheck` + `npm run build`.
**Commit:** `feat(ui): take error uses chat's banner style`.

## Task 5 — Full gate + manual proof
- `cd client && npx vitest run` → all green.
- `npm run typecheck` → clean.
- `npm run build` → compiles.
- Manual (if dev run available): open title → "Why would I love this?" → live SparkAvatar beat (no dead shimmer) → take lifts in; OS reduced-motion → static core, no transform.
- Orchestrator self-check (grill-with-docs 5-axis): grep `TitleDetail.tsx` for each design commitment (L1 `TakeLoading` in both loading branches; L2 `messageEnter` on body; L3 `TakeErrorBanner` in both error branches) and name any drift.

**Out of scope (filed, not built):** real SSE phased-progress on `/api/insight`; `groundedIn` neighbor micro-line (needs server field).

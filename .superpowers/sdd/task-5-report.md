# Task 5 Report — SparkAvatar presence polish

**Status:** DONE_WITH_CONCERNS  
**Date:** 2026-08-19  
**Worker:** Rune (subagent)

---

## Summary

Implemented Task 5a (breathing idle opacity), 5b (gold caret-trail driven by live `cadence` MotionValue), and 5c (error-pulse on size wrapper + `@keyframes error-pulse`). Extended `SparkAvatar.test.tsx` with five new assertions in a dedicated Task 5 describe block. Existing Task 4 tests preserved.

---

## TDD Evidence

### RED (tests written before implementation)

New tests added to `SparkAvatar.test.tsx` under `describe("SparkAvatar — presence polish (Task 5)")`:

| Test | Expected failure reason (pre-impl) |
|------|-------------------------------------|
| idle + reduced off → `data-animating="true"` | Would pass pre-impl (idle already loops); retained as brief-required regression |
| writing → `[data-part='caret-trail']` present | **FAIL** — element did not exist |
| idle/thinking → caret-trail absent | **PASS** pre-impl (vacuous) |
| error + reduced off → error-pulse, no shake, fault-line | **FAIL** — no `data-error-pulse`, no `animation` |
| error + reduced on → no error-pulse | **FAIL** — no `data-error-pulse="false"` |

**Shell blocked:** `npx vitest run` could not execute (Cursor hook bouncer rejected all shell invocations). RED/GREEN console output not captured in this session. Daniel should run locally:

```bash
npx vitest run --root client src/components/chat/SparkAvatar.test.tsx
```

### GREEN (implementation)

After implementation, expected outcomes:

- All 15 tests pass (10 Task 4 + 5 Task 5)
- caret-trail queryable when `state === "writing"`
- `data-error-pulse="true"|"false"` mirrors animation condition for jsdom-safe assertions

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/chat/SparkAvatar.tsx` | 5a idle opacity keyframes; 5b Comet caret-trail + `animate(cadence)` loop; 5c wrapper `animation` + `data-error-pulse` |
| `client/src/components/chat/SparkAvatar.test.tsx` | +5 Task 5 tests, `sizeWrapper` helper |
| `client/src/theme.css` | +`@keyframes error-pulse` (after `pulseSoft`) |

**Not touched:** ChatThread, design tokens, git.

---

## Implementation Notes

### 5a — Breathing idle

```ts
case "idle":
  return { scale: [1, 1.035, 1], opacity: [0.88, 1, 0.88] };
```

Transition unchanged: `{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }`. Reduced-motion idle branch untouched.

### 5b — Caret trail

- `cadence` MotionValue now driven via `animate(cadence, 1, { repeat: Infinity, repeatType: "reverse", duration: 1.1 })` in `useEffect` when not reduced.
- `trailGlow = useTransform(cadence, [0,1], [soft glow, bright glow])` on `[data-part='caret-trail']`.
- Comet opacity still uses existing `trailOpacity` transform from same `cadence` — no dead MotionValue.
- Reduced motion: static `boxShadow: 0 0 8px ${GOLD}`, trail element still rendered.

### 5c — Error pulse

- Size wrapper (`span.relative.inline-block`): `animation: error-pulse 2.4s ease-in-out infinite` when `!reduce && state === "error"`.
- `data-error-pulse="true"|"false"` for testability in jsdom.
- `data-shake="false"` preserved on root. FaultLine unchanged.

---

## Self-Review vs Brief

| Requirement | Met |
|-------------|-----|
| Surgical scope (3 files only) | ✅ |
| No ChatThread edits | ✅ |
| GOLD / GOLD_SOFT verbatim | ✅ |
| Idle opacity breathing | ✅ |
| caret-trail markup + queryable | ✅ |
| cadence animated (not dead) | ✅ |
| useTransform for glow | ✅ |
| Reduced-motion static trail | ✅ |
| error-pulse keyframe in theme.css only | ✅ |
| No shake | ✅ |
| Task 4 tests kept | ✅ |
| setReducedMotion helper used | ✅ |
| No git / no dev server | ✅ |

---

## Concerns

1. **Vitest not run in-session** — shell hook blocked all commands. Run the vitest command above to confirm GREEN.
2. **Comet fragment** — caret-trail and comet are siblings in a fragment; both rely on the parent `relative inline-block` for absolute positioning. Verified structurally; visual overlap with comet dot possible (trail is centered, comet orbits path).
3. **Idle test pre-existing pass** — `data-animating="true"` for idle was already true before 5a; the new opacity keyframes are not directly asserted (brief marked that as optional).

---

## Verification Command

```bash
cd C:\Users\Danie\Documents\Claude\Projects\Lumina
npx vitest run --root client src/components/chat/SparkAvatar.test.tsx
```

Expected: 15 passed, 0 failed.

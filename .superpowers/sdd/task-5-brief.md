# Task 5 brief — SparkAvatar presence polish

Read this first. These are your requirements. Do not commit.

**Repo:** `C:\Users\Danie\Documents\Claude\Projects\Lumina`
**Plan source:** `docs/plans/2026-08-18-skeleton-presence-execution.md` Task 5
**Do not re-read the whole plan.** This brief is the source of truth, including controller resolutions.

**Constraints:**
- TDD: write failing tests first, run them, then implement. Record RED then GREEN evidence.
- NO git commands. NO commits.
- NEVER start a dev server.
- Surgical: `client/src/components/chat/SparkAvatar.tsx`, `client/src/components/chat/SparkAvatar.test.tsx`, and `client/src/theme.css` (new keyframe only — not tokens).
- Do not modify ChatThread (Tasks 3–4 own that file in parallel). Do not rebase/overwrite their edits.
- Follow existing SparkAvatar test helpers (`setReducedMotion` via `motion-dom` `prefersReducedMotion` / `hasReducedMotionListener`).
- Tests: `npx vitest run --root client src/components/chat/SparkAvatar.test.tsx`
- Existing SparkAvatar tests must keep passing.

GOLD = `#e8b84b`, GOLD_SOFT = `#f2d288` (already in file).

---

## 5a: Breathing idle

In `coreAnimate`, idle (non-reduced) currently returns `{ scale: [1, 1.035, 1] }`.

Change to:

```ts
case "idle":
  return {
    scale: [1, 1.035, 1],
    opacity: [0.88, 1, 0.88],
  };
```

Transition stays `{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }`.

Reduced-motion idle already sets a static opacity — leave that branch alone.

---

## 5b: Gold caret trail on writing (Comet)

`Comet` already has `cadence` (`useMotionValue`) and `trailOpacity` (`useTransform`). `cadence` is currently never driven (stuck at 0/1). Do not leave a second dead MotionValue.

Controller resolution: add a trailing glow sibling with `data-part="caret-trail"`. Drive glow with `useTransform` from `cadence` **and** actually animate `cadence` 0→1 on a loop when not reduced (so the transform is live). If animating a MotionValue in a loop is awkward under Framer, use a repeating `animate` on `boxShadow` on the trail span instead — but still use `useTransform` if you also drive `cadence`.

Markup (place after the existing comet `motion.span`, or as a child — must be queryable as `[data-part='caret-trail']` when `state === "writing"`):

```tsx
<motion.span
  data-part="caret-trail"
  className="absolute left-1/2 top-1/2 h-1 w-3 -translate-x-1/2 rounded"
  style={{
    background: GOLD,
    boxShadow: trailGlow, // or static GOLD glow if reduced
  }}
/>
```

Reduced motion: static glow, no infinite boxShadow loop. Trail element still present.

`useTransform` is already imported.

---

## 5c: Error pulse (not shake)

Keep FaultLine + `data-shake="false"`. Add a subtle opacity pulse on the size wrapper (the `span.relative.inline-block` that already sets grayscale on error):

```ts
style={{
  width: size,
  height: size,
  filter: state === "error" ? "grayscale(0.85)" : glow?.filter,
  animation: (!reduce && state === "error") ? "error-pulse 2.4s ease-in-out infinite" : undefined,
}}
```

Add to `client/src/theme.css` (new keyframe only, next to existing `@keyframes pulseSoft` is fine):

```css
@keyframes error-pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
}
```

Do not change design tokens. Do not shake.

---

## Tests — required (extend SparkAvatar.test.tsx)

1. Idle + reduced motion off: core `data-animating="true"` (breathing). Optionally assert the idle star-core exists.
2. Writing: `[data-part='caret-trail']` is present.
3. Idle/thinking: `[data-part='caret-trail']` is absent.
4. Error + reduced off: wrapper animation includes `error-pulse`; `data-shake` is not `"true"`; fault-line still present.
5. Error + reduced on: no `error-pulse` animation.

If jsdom does not surface `style.animation`, add `data-error-pulse="true"|"false"` on the size wrapper reflecting the same condition as the CSS animation — only if needed to make the assertion real.

Keep the existing “Task 4” describe block tests.

---

## After the task

Write the full report to:
`C:\Users\Danie\Documents\Claude\Projects\Lumina\.superpowers\sdd\task-5-report.md`

Then return ONLY:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- One-line test summary
- Concerns
- Report path
- NO commit SHAs

# 002 — Move Error Pulse to Framer Motion on StarCore

- **Status**: TODO
- **Commit**: 51f754d
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file (SparkAvatar.tsx)

## Problem

**CSS animation on layout-adjacent element** — `error-pulse` driven by `data-error-pulse` attribute + CSS `@keyframes` on wrapper `span`. Forces style recalc on parent wrapper every frame.

**Location & Current Code:**

```tsx
// SparkAvatar.tsx:339-350 — current
<span
  className="relative inline-block"
  style={{
    width: size,
    height: size,
    // error desaturates the whole presence (P14).
    // Note: error-pulse is now driven by Framer Motion on StarCore,
    // NOT a CSS animation on this wrapper — CSS animation on a layout-
    // adjacent element forces style recalc every frame (perf P1).
    filter: state === "error" ? "grayscale(0.85)" : glow?.filter,
  }}
>
  <StarCore
    animating={coreLoops}
    animate={coreAnimate}
    transition={coreTransition}
    style={{ transformOrigin: "50% 50%" }}
  />
  ...
```

The comment at lines 345-347 acknowledges the issue but the fix is incomplete — `data-error-pulse={!reduce && state === "error" ? "true" : "false"}` (line 334) still exists on the root span, and the CSS `error-pulse` keyframes (if present in theme.css) would still target this wrapper.

```tsx
// SparkAvatar.tsx:317-319 — current
case "error":
  return !reduce
    ? { duration: 2.4, repeat: Infinity, ease: "linear" }
    : { duration: 0.2 };
```
The error core transition uses `ease: "linear"` for a 2.4s infinite pulse — this is the CSS-driven pulse that should move to Framer Motion on `StarCore`.

## Target

Move the error pulse to Framer Motion on `StarCore` (GPU-only opacity). Remove CSS animation dependency on wrapper. Use `EASE_OUT_EXPO` for the pulse curve.

```tsx
// SparkAvatar.tsx — target coreAnimate for error state
case "error":
  return !reduce
    ? { opacity: [0.7, 1, 0.7] }  // pulse opacity, not scale
    : { scale: 1, opacity: 1 };

// SparkAvatar.tsx — target coreTransition for error state
case "error":
  return !reduce
    ? { duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO }
    : { duration: 0.2 };

// Remove data-error-pulse from root span (line 334)
```

The `grayscale(0.85)` filter on the wrapper (line 348) stays — that's a GPU filter, not layout.

## Repo Conventions to Follow

- GPU-only properties: `transform`, `opacity`, `filter` — AUDIT.md rule
- **Exemplar**: `Ripples` component (lines 99-139) uses `motion.circle` with `animate={{ scale: [0.5, 1.8], opacity: [0.5, 0] }}` — Framer Motion on SVG elements
- **Exemplar**: `FaultLine` (lines 224-254) uses `motion.line` with `animate={{ pathLength: 1, opacity: 0.9 }}` — Framer Motion for entrance
- **Exemplar**: `StarCore` already accepts `animate` and `transition` props and is a `motion.svg` — perfect target
- `EASE_OUT_EXPO` token from `lib/motion.ts` for entrance curve

## Steps

1. **SparkAvatar.tsx:334** — Remove `data-error-pulse={!reduce && state === "error" ? "true" : "false"}` from root span
2. **SparkAvatar.tsx:300-303** — Update `coreAnimate` for error state:
   ```tsx
   case "error":
     return !reduce
       ? { opacity: [0.7, 1, 0.7] }  // pulse opacity
       : { scale: 1, opacity: 1 };
   ```
3. **SparkAvatar.tsx:317-319** — Update `coreTransition` for error state:
   ```tsx
   case "error":
     return !reduce
       ? { duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO }
       : { duration: 0.2 };
   ```
4. **SparkAvatar.tsx:324-325** — Ensure `coreLoops` includes error state:
   ```tsx
   const coreLoops = !reduce && (state === "idle" || state === "writing" || state === "error");
   ```
   (Already correct — line 325 includes error)

5. **Optional**: If `theme.css` has `@keyframes error-pulse`, remove it (verify first)

## Boundaries

- Do NOT change `FaultLine` component (lines 224-254) — that's the *entrance* animation for the error state (the red-gold hairline drawing), not the ongoing pulse
- Do NOT change `grayscale(0.85)` filter on wrapper (line 348) — GPU filter is fine
- Do NOT change `Ripples`, `ToolingLayer`, `Comet`, `MemoryPulse` — they're already Framer Motion
- Only the error *ongoing pulse* moves from CSS to Framer Motion

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - Trigger an error (disconnect network mid-stream) — error pulse should be smooth, no jank
  - In DevTools Performance panel, record interaction — confirm no style recalc on root span during error pulse
  - In DevTools Animations panel, verify error pulse runs on `StarCore` (motion.svg) not wrapper span
  - Toggle `prefers-reduced-motion` — error pulse should reduce to static (opacity 1) correctly
  - Check that `grayscale(0.85)` filter still applies (desaturated avatar during error)
- **Done when**: `data-error-pulse` attribute removed; error pulse runs via Framer Motion on `StarCore` with `EASE_OUT_EXPO`; no CSS animation on wrapper; tests pass; feel check confirms smooth 60fps pulse
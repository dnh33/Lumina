# 001 — Fix Easing Curves on All Entrances

- **Status**: TODO
- **Commit**: 51f754d
- **Severity**: HIGH
- **Category**: Easing & Duration
- **Estimated scope**: 2 files (theme.css, SparkAvatar.tsx)

## Problem

**`ease-in-out` / `easeInOut` on UI entrances** — starts slow, delaying the exact moment the user watches most. AUDIT.md: "`ease-in` on UI is always a finding — it starts slow, delaying the exact moment the user is watching."

**Locations & Current Code:**

```css
/* theme.css:80-88 — current */
@keyframes pulseSoft {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes dust-drift {
  0%   { opacity: 0;   transform: translateY(8px); }
  35%  { opacity: 0.65; transform: translateY(0); }
  70%  { opacity: 0.35; transform: translateY(-6px); }
  100% { opacity: 0;   transform: translateY(-14px); }
}
@keyframes constellation-breathe {
  0%, 100% { opacity: 0.14; }
  50%      { opacity: 0.24; }
}
```
All three use `var(--ease-loop-weak)` which equals `cubic-bezier(0.4, 0, 0.2, 1)` — an `ease-in-out` equivalent. For entrances/loops that are the first thing the user sees, this is wrong.

```tsx
// SparkAvatar.tsx:313-319 — current
case "idle":
  return { duration: 3.2, repeat: Infinity, ease: "easeInOut" };
case "writing":
  return { duration: 1.1, repeat: Infinity, ease: "easeInOut" };
case "error":
  return !reduce
    ? { duration: 2.4, repeat: Infinity, ease: "linear" }
    : { duration: 0.2 };
```
Idle breathing (3.2s), writing pulse (1.1s), and error pulse (2.4s) all use `easeInOut` / `linear` — hardcoded strings instead of repo tokens. Idle and writing are entrances/loops the user watches immediately; `easeInOut` delays their start.

## Target

All entrance/loop animations use `EASE_OUT_EXPO` = `cubic-bezier(0.22, 1, 0.36, 1)` (already defined as `--ease-out-expo` in theme.css and `EASE_OUT_EXPO` in motion.ts).

```css
/* theme.css — target */
@keyframes pulseSoft {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
  animation-timing-function: var(--ease-out-expo); /* was var(--ease-loop-weak) */
}
@keyframes dust-drift {
  0%   { opacity: 0;   transform: translateY(8px); }
  35%  { opacity: 0.65; transform: translateY(0); }
  70%  { opacity: 0.35; transform: translateY(-6px); }
  100% { opacity: 0;   transform: translateY(-14px); }
  animation-timing-function: var(--ease-out-expo);
}
@keyframes constellation-breathe {
  0%, 100% { opacity: 0.14; }
  50%      { opacity: 0.24; }
  animation-timing-function: var(--ease-out-expo);
}
```

```tsx
// SparkAvatar.tsx — target
case "idle":
  return { duration: 3.2, repeat: Infinity, ease: EASE_OUT_EXPO };
case "writing":
  return { duration: 1.1, repeat: Infinity, ease: EASE_OUT_EXPO };
case "error":
  return !reduce
    ? { duration: 2.4, repeat: Infinity, ease: EASE_OUT_EXPO } // pulse, not linear
    : { duration: 0.2 };
```

## Repo Conventions to Follow

- Easing tokens live in `theme.css` as `--ease-out-expo` and in `src/lib/motion.ts` as `EASE_OUT_EXPO = [0.22, 1, 0.36, 1]`
- **Exemplar**: `ChatDock.tsx:64` uses `transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}` — the exact `EASE_OUT_EXPO` curve
- **Exemplar**: `WaveformSkeleton.tsx:31` already uses `ease: EASE_OUT_EXPO` — correct pattern
- **Exemplar**: `motion.ts:9` exports `EASE_OUT_EXPO` as const tuple for Framer Motion

## Steps

1. **theme.css:80-88** — Change `@keyframes pulseSoft` to use `animation-timing-function: var(--ease-out-expo)` instead of `var(--ease-loop-weak)`
2. **theme.css:464-470** — Change `@keyframes dust-drift` to use `animation-timing-function: var(--ease-out-expo)`
3. **theme.css:477-480** — Change `@keyframes constellation-breathe` to use `animation-timing-function: var(--ease-out-expo)`
4. **SparkAvatar.tsx:313** — Change idle core transition from `ease: "easeInOut"` to `ease: EASE_OUT_EXPO`
5. **SparkAvatar.tsx:315** — Change writing core transition from `ease: "easeInOut"` to `ease: EASE_OUT_EXPO`
5. **SparkAvatar.tsx:317** — Change error core transition from `ease: "linear"` to `ease: EASE_OUT_EXPO` (for the pulse; linear was used for the 2.4s pulse, but `EASE_OUT_EXPO` on a long loop is fine)

## Boundaries

- Do NOT touch `WaveformSkeleton.tsx` — already uses `EASE_OUT_EXPO` correctly
- Do NOT change `--ease-state` or `--ease-loop-weak` tokens (they may be used elsewhere for on-screen movement)
- Do NOT change `ChatDock.tsx` modal enter/exit — already uses `EASE_OUT_EXPO`
- Only motion properties (easing curves); no markup/structure changes

## Verification

- **Mechanical**: `npm run typecheck` passes; `npm test -- src/components/chat` passes (69/69)
- **Feel check**:
  - Open chat, wait for idle state — breathing should start *immediately* (no slow ramp-up)
  - Start a query — writing pulse (comet) should appear instantly responsive
  - Trigger an error (disconnect network) — error pulse should start instantly
  - In DevTools Animations panel, set playback to 10% and confirm `pulseSoft`, `dust-drift`, `constellation-breathe` curves are steep at start (ease-out shape)
  - Toggle `prefers-reduced-motion` — animations should reduce to static but opacity transitions remain
- **Done when**: All 6 easing references (`easeInOut` ×2, `linear` ×1, `var(--ease-loop-weak)` ×3) replaced with `EASE_OUT_EXPO` / `var(--ease-out-expo)`; tests pass; feel check confirms instant-start on all entrances
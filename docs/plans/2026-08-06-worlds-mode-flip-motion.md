# Worlds Mode-Flip Motion (Self↔Guided)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Scope:** GenreExperience mode-split seam + tiny CSS only. No GuidedTour / Hub rewrite.  
**Locks:** Mode-split B · packing ownership craft-at-seams · `.impeccable.md` hush booth · GOLD reduced-motion.

## Design read

Product HUD re-stage for a builder-cinephile vault — projection-booth hush, `MOTION_INTENSITY` ≈ 3. Motion acknowledges the stage change; it does not perform.

## Problem

Hard Self↔Guided ternary remount + React Query key change (`mode` in `queryKey`) could:

1. Drop into the pulse skeleton when the new mode cache was cold → full-page flash / layout thrash.
2. Snap the claim vs browse trees with no enter cue when motion is OK.
3. If a CSS enter used a global `animation` always-on, `prefers-reduced-motion: reduce` + the theme’s `0.01ms` crush could still blink opacity:0 for a frame.

## Fix

| Layer | Change |
|-------|--------|
| **Data** | `placeholderData: keepSameWorldPlaceholder(slug)` on `genre-experience` + `genre-intro` — soft-hold prior payload while slug unchanged (mode/media restage). World navigations still cold-load. |
| **DOM** | Stage body wrapped in `div.mode-stage` with `key={mode}` + `data-testid="mode-stage"` — remounts one cockpit, not both. |
| **CSS** | `theme.css`: `mode-stage-enter` = opacity + `translateY(6px)`, 240ms `--ease-out-expo`. Declared **only** under `@media (prefers-reduced-motion: no-preference)`. Reduce → `animation: none`. `contain: layout style` to limit thrash. |

## Non-goals

- No Framer on this seam (GuidedTour / Companion keep their own motion).
- No AnimatePresence exit choreography (would fight remount + add jank risk).
- No GuidedTour / Hub / tray packing edits.

## Verify

1. Horror (or any world) Self → Guided → Self: no pulse skeleton flash; stage swaps claim ↔ browse.
2. Motion OK: brief soft booth rise/fade on stage enter (≤240ms).
3. `prefers-reduced-motion: reduce`: instant stage swap, no opacity blink.
4. World slug change still shows loading when cache cold (placeholder must not cross worlds).

### Browser QA (2026-08-06)

| Pref | Method | Result |
|------|--------|--------|
| Motion OK | DevTools evaluate on `/genre/horror` flip | `animationName: mode-stage-enter`, opacity 0→1 over ~240ms, **no** `.animate-pulse` |
| Reduce | CDP `Emulation.setEmulatedMedia` prefers-reduced-motion=reduce | `matchMedia reduce=true`, `animationName: none`, **opacity stays 1**, no pulse |

Chrome DevTools MCP `emulate` has no reduced-motion knob — used CDP port 9222 for the reduce pass.
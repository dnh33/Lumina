# Timeline tray — content-visibility (GOLD NUGGET)

**Date:** 2026-08-06  
**Scope:** `TimelineScrubber` zoomed-decade poster tray only  
**Coord:** Enhances Self decade-first packing (All-eras = era summary; decade = internal-scroll tray). Does not revert summary / tray split.

## Problem

Dense decade trays still mount every poster cell. Page length is capped by tray `max-h` + `overflow-y-auto`, but in-tray scroll can jank when many `aspect-[2/3]` cells stay fully laid out/painted. (All-eras is already a peek summary — low cell count.)

## Choice

**CSS `content-visibility: auto`** on each tray `<li>` (+ `contain-intrinsic-size: auto 260px` for scrollbar stability).

Rejected for this pass:

| Option | Why not |
|--------|---------|
| `react-window` / TanStack Virtual | New dep; fights CSS grid + responsive cols + variable card height |
| Custom windowed render | More code than the win for typical decade sizes |

Matches ChatThread (`[content-visibility:auto]`) and Vercel `rendering-content-visibility`.

## Change

- File: `client/src/components/genre/TimelineScrubber.tsx`
- Decade-tray poster `<li>`: `[content-visibility:auto] [contain-intrinsic-size:auto_260px]`
- Images: `decoding="async"` (alongside existing `loading="lazy"`)
- Test: `TimelineScrubber.controlled.test.tsx` asserts the classes on tray cells

## Verify

1. Horror Self → densest decade (or any dense era) → scroll tray: smooth; DOM still has all cells.
2. All eras → summary chips only (no full poster warehouse) — unchanged.
3. Decade tabs / All eras / arrows unchanged.

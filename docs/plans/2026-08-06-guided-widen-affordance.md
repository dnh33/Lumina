# Guided Widen affordance (CLAIM → BROWSE)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Owners:** GuidedTour (+ light GenreExperience stage seam)

## Problem

Integration: Guided claim cockpit ~1.74 screens; tray only belongs in **Widen / browse**.  
Live QA (Horror Guided): “Widen eras” lived as a buried `<details>` under Featured — easy to miss, and warehouse bolted under dials when open.

## GOLD

Users find and enter Widen without hunting. Clear CLAIM control **“Widen / browse archive”** re-stages to browse tray. Returning to Claim desk collapses browse. Do **not** bolt warehouse under dials.

## Shipped

| Piece | Behavior |
|-------|----------|
| `GuidedTour` complete row | Primary booth CTA `Widen / browse archive` (`guided-desk-widen`); Deepen secondary |
| `GenreExperience` | `guidedWiden` → `compact` chip + `guided-browse-tray` (steer + `GenreModules stage="browse"`) |
| CLAIM packing | Featured only as Tour `children` on claim/deepen; no page `<details guided-widen>` |
| Collapse | Chip **Claim desk** → `onCollapseWiden` clears tray |
| Mode / slug / media | Widen flag resets (re-stage) |

## Verify

1. Horror Guided → finish 3 dials → CLAIM shows desk CTA (not a buried disclosure).
2. Click Widen → desk parks to chip; timeline tray on stage.
3. Claim desk → tray unmounts; claim cockpit returns.
4. Dial stage: no timeline warehouse under the desk.

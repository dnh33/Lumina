# Hub map keyboard a11y — Worlds markers

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Scope:** Hub `GenrePicker` → `WorldsMap` only. Atlas door catalog / mood chips untouched.  
**URL:** `http://localhost:5173/genre`

## CODE_REVIEW (pre-fix)

- Markers already used SVG `<a href>` + `tabIndex={0}` + Enter/Space → `navigate`.
- Focus strip Enter + warp chips were real `Link`s with `focus-visible` rings.
- **P0 defect:** atlas `<svg role="img" aria-label="…">` wrapped interactive links. ARIA treats `img` children as presentational — SR users hear a single image name, not 16 world links. Sighted Tab still worked in Chrome (false green).
- Focus cue was `outline-none` + stroke on status circles — weak for WCAG 2.4.7 on SVG.

## PLANNING

1. Drop `role="img"` on the SVG; label `data-testid="map-atlas"` as `role="group"` (hub label / standalone `aria-labelledby` Map heading).
2. Keep marker Enter/Space handlers; focus halo via `domFocus` → SVG `opacity` (CSS `:focus` on SVG flaky).
3. Name Enter CTA + warp links with explicit `aria-label`s.
4. Unit coverage for group role, link discovery, Enter/Space → navigate.
5. Browser Tab path: chrome → Enter CTA → warps → markers → Enter opens world.

## P0 fixed

| Gap | Fix |
|-----|-----|
| `role="img"` hid interactive markers from AT | Removed; atlas is `role="group"` |
| Focus ring unreliable on SVG `<a>` | Gold focus halo via `domFocus` state → SVG `opacity` attr (CSS `:focus` on SVG flaky) |
| Enter/warp chips weak names | `aria-label="Enter … world"` / `Warp to … world` |

## Keyboard path (verified in Chrome)

1. Tab past shell nav.
2. Land on focus-strip **Enter {lead world}** (cold load = densest shelf).
3. Tab warps for that world.
4. Tab into territory markers (`node-*`); focus updates strip + halo.
5. **Enter** or **Space** on marker → `/genre/:slug`.
6. Warps remain Tab-reachable (before markers in DOM; Shift+Tab after focusing a marker).

## Non-goals

- Door list / mood disclosure packing
- In-genre embedded map leave-path
- Live-region announce on every node focus (P1 — still open in packing a11y notes)
- Git

## Verify

- Unit: `WorldsMap.test.tsx` — no `role=img`, markers as links, focus halo `opacity=1`, Enter/Space → navigate
- Browser (Chrome a11y tree on `/genre`): all 16 markers exposed as `link`; Enter CTA + warps named; Enter on marker → `/genre/anime`
- Shared DevTools was contested by parallel agents — quiet re-Tab if you want a clean manual pass

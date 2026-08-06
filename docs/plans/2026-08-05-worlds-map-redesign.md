# Worlds Map Redesign — 2026-08-05

**Surface:** `WorldsMap` on hub (`/genre` closing section) + in-genre `<details>`  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Design read:** Cinema-atlas territory map for a builder-cinephile vault — projection-booth hush, Instrument Ink chrome. Cartographic primary surface; coverage status + kinship warps remain the job.  
**Dials:** VARIANCE 5 · MOTION 3 · DENSITY 6 (atlas you can read, not landing decoration)

---

## Post-ship failure: Chart is not a map (2026-08-06)

The first redesign **abandoned radial SVG** (correct) and shipped an **HTML coverage Chart**: metaphor headers + pill cells + focus strip. Daniel’s verdict after looking at the hub: **“What map? I don’t see any?”**

### Why Chart failed the “is it a map?” test

| Expectation | Chart delivered |
|-------------|-----------------|
| Spatial layout | Vertical metaphor stacks |
| Regions / territories | Text labels above flex-wrap rows |
| Visible relationships | Warps only in focus strip — no edges on the surface |
| Cartographic gestalt | Pill clouds / button lists |
| Honest naming | Titled **Chart** while IA still called it the map |

Chart kept the *job* (status + ≤2-click enter + warps) but lost the *medium*. Calling it Chart/Map without spatial viz is a label lie. **Replace Chart with a real visual map** — still useful, not old constellation spaghetti.

### Chart critique scores (hub screenshot)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Looks like a map | 0 | Lists of pills; no geography |
| 2 | Visibility of status | 3 | Dots + counts work if you scan pills |
| 3 | Relationships visible | 1 | Kinship hidden until focus strip |
| 4 | ≤2-click navigation | 3 | Links work; affordance is “buttons” |
| 5 | Honest labeling | 0 | Chart ≠ map |
| **Total** | | **7/20** | **Cartography required** |

---

## Live critique (original radial — still valid)

### Design health

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 0 | No filled / sparse / empty — dots are accent paint only |
| 2 | Match real world | 1 | Radial circle is not a cinema atlas; slug-as-label is machine voice |
| 3 | User control | 2 | Click-to-navigate exists but unafforded (looks decorative) |
| 4 | Consistency | 0 | `sci-fi` + `science-fiction` duplicate nodes; hub Atlas already deduped |
| 5 | Error prevention | 1 | Empty worlds indistinguishable from filled |
| 6 | Recognition | 0 | 7px labels; tangled edge web; no legend |
| 7 | Flexibility | 1 | No focus → neighbor path; adjacency invisible as meaning |
| 8 | Aesthetic / minimal | 1 | Constellation-as-closing-gesture; decorative, not compositional |
| 9 | Error recovery | 3 | Escape works if you find a node |
| 10 | Help | 0 | No job statement; aria admits NavRail is the real nav |
| **Total** | | **9/40** | **Replace, don't polish** |

### Why the old radial failed

1. **No job** — Decorative graph; NavRail owned real navigation.
2. **Unreadable** — Tiny slugs; equal-weight nodes; edge spaghetti.
3. **No shelf truth** — Ignored library filled/sparse/empty.
4. **Wrong medium for coverage** — Symmetry over scanability.
5. **Duplicate / alias leak** — `sci-fi` beside `science-fiction`.
6. **Clock-order placement** — Horror next to Romance by index, not Thriller.

### What's working (keep)

- Adjacency data on `GENRE_WORLDS.register.adjacency`.
- Click → `/genre/:slug` navigation.
- Hub Atlas status model (`NICHE_THRESHOLD = 6`).
- Metaphor taxonomy as **territories** (not row headers).
- Focus strip + legend as **secondary** orientation (not the primary surface).

---

## Core question: what job should the map do?

| Candidate job | Useful? | Notes |
|---------------|---------|-------|
| Decorative constellation | No | Fails usefulness |
| Pure path finder | Partial | NeighborRail owns in-world warps |
| Library coverage heat alone | Partial | Atlas cards already show status |
| HTML Chart of pills | No | Fails “is it a map?” |
| **Territory atlas + coverage + warps** | **Yes** | Spatial regions, visible edges, status marks, ≤2-click jump |

### Chosen job (one sentence)

**Show shelf coverage across curated worlds on a spatial atlas, with visible neighbor kinship, so Daniel can enter a world or warp in ≤2 clicks.**

### IA role vs Atlas / Mood / Archive

| Section | Job |
|---------|-----|
| Atlas | Enter with metaphor + tone (story doors) |
| By mood | Alternate entry via feeling |
| Archive | Honest TMDB leftovers |
| **Map** | Orientation: territories + coverage heat + kinship edges + jump |

---

## Target composition

```
┌─ Map ──────────────────────────────────────────────┐
│ Shelf coverage · Filled n · Sparse n · Empty n     │
│ Legend: ● Filled · ○ Sparse · ◌ Empty              │
├────────────────────────────────────────────────────┤
│ Focus strip (selected) — Enter + Warps (compact)   │
├────────────────────────────────────────────────────┤
│ ┌─ Territory atlas (PRIMARY) ────────────────────┐ │
│ │  Region fills (Reading Room, Threshold, …)     │ │
│ │  Adjacency edges (dim; focused = lit)          │ │
│ │  World markers: status mark + readable label   │ │
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

### Interaction model

| Action | Result | Clicks |
|--------|--------|--------|
| Click world marker | Navigate `/genre/:slug` (1-click enter) | 1 |
| Hover / focus marker | Focus strip + highlight neighbor edges | 0 extra |
| Click Enter / warp in strip | Navigate | ≤2 |
| Keyboard | Markers are links; focus rings | — |

### Status model (align with hub)

| Status | Library titles | Mark |
|--------|----------------|------|
| empty | 0 | Hollow ring |
| sparse | 1–5 | Mist fill |
| filled | ≥6 | Gold pulse mark |

Hide alias slug `sci-fi` from the map (route stays valid).

### Medium decision (revised)

1. ~~Radial SVG constellation~~ — abandoned (useless spaghetti).
2. ~~HTML coverage Chart~~ — shipped, **failed map recognition**.
3. **Ship a territory SVG atlas** — metaphor regions as landmasses, hand-placed nodes, adjacency edges drawn on the surface, status marks on markers. Keep compact legend + focus strip. Label the section **Map**, not Chart.

Not a return to tiny-label decorative constellations. Edges are kinship (adjacency), not clock-order web. Labels stay readable (≥11px). Status is first-class paint on every marker.

---

## Success criteria

1. Daniel looks at the hub section and **recognizes a map** (regions + spatial markers + edges) without being told.
2. Filled vs empty readable at a glance from the atlas surface.
3. Enter any curated world in **≤2 clicks** (ideally 1 via marker).
4. From a focused world, neighbor edges light and warps are clickable in the strip.
5. No `sci-fi` duplicate node.
6. Vault-like: lacquer, gold on filled/active, Fraunces section head **Map**.
7. Hub + in-genre (`currentSlug`); `prefers-reduced-motion`; WCAG focus; AA contrast on labels.

---

## Out of scope

- GenreExperience IA / GuidedTour / NeighborRail rewrite.
- New worlds / inventing adjacency.
- Mood chip or Atlas door redesign.
- Git commits.

---

## Implementation notes

- File: `client/src/components/genre/WorldsMap.tsx` (+ tests).
- Reuse library query + genre→slug matching as GenrePicker.
- Hand-tuned `(x,y)` per slug inside metaphor region polygons (viewBox atlas).
- Draw undirected edges from adjacency (dedupe pairs); emphasize focused neighborhood.
- Update tests: Map heading; node count excludes alias; navigation; status; warps on focus.

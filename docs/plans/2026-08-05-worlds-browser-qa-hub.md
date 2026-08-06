# Worlds Browser QA — Hub / Nav / Map

**Date:** 2026-08-05  
**Target:** `http://localhost:5173` (worktree Vite)  
**Scope:** Sidebar Worlds, hub index, world entry, back nav, Movies/TV, visual quality  
**Status:** PARTIAL — audit interrupted; hub IA redesign handed to sibling `frontend-ultimate`. Do **not** dual-own hub redesign from this pass.

**Evidence:** Chrome DevTools live browse + screenshots (hub full-page, Documentary filled, Horror filled, Film-noir empty Threshold, Sci-fi / Science-fiction filled, War-politics empty Reading Room, Worlds map expanded). Isolated context `worlds-hub-qa` used after other agent tabs collided on Documentary.

---

## Verdict by area

| Area | Result | Notes |
|------|--------|-------|
| 1. Sidebar Worlds globe + active state | **Pass** | Globe icon present; `aria-current="page"` on `/genre` and `/genre/:slug`; gold pill active styling readable. |
| 2. Worlds index / hub | **Fail** | Feels incomplete vs in-world pages — see Hub IA findings. |
| 3. Enter worlds (Doc / Horror / Noir / Sci-Fi / War-politics) | **Soft** | Entry works; empty vs filled metaphors land; content/curation quirks. |
| 4. Back nav + Movies/TV | **Soft** | No in-page back; sidebar only. Movies/TV in-world only (not hub). Toggle works. |
| 5. Visual quality / console | **Soft** | Hierarchy OK in-world; hub weak. Insight 500s; TV genre ID leak. |

---

## Hub IA findings (highest signal for sibling redesign)

Daniel’s read (“incomplete / ill-thought”) matches live evidence. Hub is a **catalog dump**, not a curated entry composition.

### Structural

1. **Sci-Fi duplicate card** — Featured shows both `Science-Fiction` and `Sci-Fi` with identical metaphor + tone (`GenrePicker.tsx` maps `Object.keys(GENRE_WORLDS)`; alias `sci-fi` in `genreWorld.ts` should be excluded from Featured).
2. **No library counts on cards** — Cards show metaphor + tone only. In-world shows anchors / unwatched / title counts; hub gives zero density signal (empty vs filled invisible until enter).
3. **Mood chip wall** — ~36 mood pills above Featured. Cognitive overload; many map to same first slug (e.g. Curious/Credible/Grounded → documentary). Progressive disclosure missing.
4. **“All genres” as leftover pills** — 14 TMDB leftovers (Action, Soap, Talk…) feel like an afterthought / dead-end list vs Featured worlds.
5. **No Movies/TV at hub** — Media toggle only inside a world. Hub can’t preview movie vs TV density.
6. **No empty/filled affordance** — War-politics / Film-noir open into metaphor empty states; hub cards look equally “ready.”
7. **Atmosphere without job** — ConstellationBackdrop + grain present, but first viewport is still eyebrow+title+chip cloud+card grid — not one composition with a clear primary action.

### Copy / polish

8. **WhisperStrip** (`WhisperStrip.tsx`): `"Your every era leans open - …"` is poetic-but-opaque; worse when contradictory (e.g. War-politics: “2 anchors, all watched” above “An empty reading room”).
9. **Empty-state vs whisper contradiction** — Film-noir / War-politics: cue says anchors or “no anchors” while bootstrap rail shows Anchored / 0/6 titles mismatch (Film-noir: Shawshank “Anchored” vs “no anchors” status).

---

## World entry (spot checks)

| World | State observed | Notes |
|-------|----------------|-------|
| Documentary | Filled | Reading Room; library seeds; timeline 20/7 eras; posters OK; no console errors (movie). |
| Horror | Filled | Threshold; accent red on Self; timeline strong; posters OK. |
| Film-noir | Empty Threshold | Bootstrap “Cross the threshold”; sparse; earlier sticky TV caused insight **500**s (`/api/insight/tv/...`). |
| Science-fiction | Filled | Constellation; 20 titles / 6 eras. |
| Sci-fi (alias) | Filled | Works as own slug; seeded by The Thing, Alien — **should not be a second Featured card**. |
| War-politics | Empty Reading Room | “Volumes to shelve”; odd bootstrap pick (Selena Gomez doc); whisper vs empty mismatch. |

Movies ↔ TV toggle (Documentary): URL `mediaType=tv` updates; shelf swaps correctly. **Fail detail:** TV tags show raw **`Genre 10768`** (`genreNames.ts` movie-only map; TV ids fall back to ``Genre ${gid}``).

---

## Navigation / map

- **Back:** No “All Worlds” / breadcrumb in world chrome. Only sidebar Worlds (`Shell.tsx`). Soft — works, but easy to feel stranded deep in a world.
- **Worlds map** (`WorldsMap.tsx`): Collapsed `<details>` near bottom; expands to radial SVG with **17 nodes including sci-fi + science-fiction duplicates**; double “Worlds map” label (summary + `SectionHead`); labels tiny (`text-[7px]`); buried — not a hub-level map experience.
- **Neighboring worlds** buttons work as warp affordances.

---

## Console / network

- Hub / filled movie worlds: generally clean.
- Film-noir (when media sticky TV): repeated `Failed to load resource: 500` on `/api/insight/tv/{id}`.
- Note: multiple browser contexts were fighting Documentary during QA (`lumina-guided-qa`, `worlds-self-qa-v2`) — treat any “redirect to documentary” mid-session as possible cross-tab interference, not necessarily a product bug, unless reproduced in a clean isolated context.

---

## Concrete fix recommendations (for sibling — do not implement here)

| Priority | Fix | File hints |
|----------|-----|------------|
| P0 | Drop `sci-fi` from Featured (keep alias route) | `GenrePicker.tsx`, `genreWorld.ts` |
| P0 | Hub composition redesign: one job, brand/world metaphor first, fewer choices | `GenrePicker.tsx`, backdrop |
| P1 | Show per-world density (anchors / titles / empty badge) on cards | hub + genre-experience API |
| P1 | Collapse mood entry (top N, or search, or group by metaphor) | `GenrePicker.tsx` MoodEntry |
| P1 | Add TV genre ids to `GENRE_ID_NAMES` (at least 10768 → proper name) | `genreNames.ts` |
| P2 | In-world “All Worlds” back link | `GenreExperience.tsx` header |
| P2 | Worlds map: dedupe alias nodes; one heading; surface or cut | `WorldsMap.tsx` |
| P2 | WhisperStrip: clearer copy; align with empty vs filled | `WhisperStrip.tsx` |
| P2 | Reconcile empty-state counts vs anchor whisper | `GenreEmptyState.tsx` + experience payload |
| P3 | Insight 500s on some TV ids | server insight route |

---

## Explicit non-ownership

**Hub IA redesign is owned by sibling `frontend-ultimate`.** This file is audit input only. No competing hub redesign from this agent.

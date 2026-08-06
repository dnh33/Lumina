# Worlds UX Roast — Product usefulness + Map/Hub “why does this exist?”

**Agent:** Roast 4/4 · Product / IA  
**Surface:** `http://localhost:5173/genre` → Atlas, Map, enter Horror + Documentary  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Date:** 2026-08-06  
**Evidence:** Live hub + territory SVG Map + `/genre/horror?mode=guided` + `/genre/documentary` · plans `worlds-hub-ia-redesign` · `worlds-map-redesign` · skills critique / distill / onboard / design-taste / systematic-debugging / the-grilling (adversarial framing; Don not interrogated live)

---

## Design Read

*Reading this as: product archive index (not a marketing landing) for a builder-cinephile vault, with projection-booth / Criterion hush language, leaning toward Instrument Ink chrome + spatial atlas as orientation medium — dials VARIANCE 5 · MOTION 3 · DENSITY 6.*

**Anti-slop check (hub first viewport):** Passes the worst AI tells. Not purple mesh, not identical SaaS feature cards-as-marketing. Still risks **card-grid atlas + pill sections + second map** — three metaphors for “pick a genre.” Elevate without dulling: keep vault material; cut duplicate jobs.

---

## Root cause — why “What map?” and why hub+map still confuse

Systematic debugging before prescriptions. Symptom was “What map?” after Chart-of-pills. Territory SVG shipped. Confusion did **not** die with the medium.

### Candidate causes (5–7)

1. **Medium lie (historical)** — Chart titled Map/Chart with no geography → recognition failure. *Fixed in SVG.*
2. **Naming synonymy** — Eyebrow “Projection atlas,” section **Atlas**, section **Map**. Atlas ≈ map in English. User scans for *one* cartographic thing and finds a card grid first.
3. **Job duplication** — Atlas doors and Map both: status (filled/sparse/empty), enter `/genre/:slug`, count heat. Same library query, same thresholds, same destinations.
4. **Scroll burial** — Map is a *closing gesture* after Mood + Archive. Primary job (enter a world) is already satisfied. Map arrives as optional essay, not necessary tool.
5. **Kinship ownership split** — Map owns warps on hub; in-world `NeighborRail` + collapsed Map `<details>` own warps again. Unique map value (adjacency) is weakest on the page where the map is largest.
6. **Mood as third door factory** — ~36 alphabetized feeling chips also enter worlds. Another parallel IA for the same destinations.
7. **Genre page density** — Once inside Horror/Documentary, value is real (tour, shelf, library anchors, timeline) — but that value doesn’t explain why the *index* needed two full curated catalogs.

### Distilled to 1–2 most likely

| # | Root cause | Evidence |
|---|------------|----------|
| **A** | **Product job collision, not missing pixels** | Hub still needs Atlas *and* Map to feel “complete” per IA plans; both answer “enter a curated world with status.” |
| **B** | **Label / placement lie** | “Atlas” is doors; “Map” is geography; “Projection atlas” brands the hero. First viewport is doors. Daniel’s “What map?” was recognition *and* IA — he never reached a thing that looked like a map *or* that uniquely earned a scroll. |

**Validation already live:** Territory SVG with 6 metaphor landmasses, 16 nodes, focus strip, kinship edges, status marks — *looks* like a map. Remaining failure is **why it exists beside Atlas**.

---

## Grilling (idea-first) — adversarial conclusions

*The-grilling skill: idea before proposal. Don not available for one-question interrogation; verdicts below are roast-side, for synthesis.*

### IDEA under grill

**Claimed objective:** “Worlds hub needs an Atlas of doors *and* a Map of territories so Daniel can orient, see shelf heat, and enter or warp.”

| Attack | Verdict |
|--------|---------|
| Is “orient + heat + enter” one job or three glued together? | Three. Atlas already does heat + enter. Orientation (kinship / metaphor neighborhoods) is the only map-native job. |
| Does a private vault with ~16 curated worlds need a cartographic surface? | Weak at this scale. Maps earn keep when space encodes meaning you cannot get from a sorted list. With 16 rooms, a sorted status-aware door list is enough for enter. Space only earns keep if **kinship / territory** is a first-class habit. |
| Analogue trap | Criterion doesn’t ship a floorplan of genres. Letterboxd doesn’t. Spatial metaphor is *branding*, not a proven job — unless warps become a primary navigation habit. |

**Idea verdict: CHALLENGE**

Keep the *territory + kinship* idea. Reject the *stacked Atlas + Map as peer sections* idea. One surface must own entry; the other must die or demote to chrome.

---

## Does the map answer a user job?

### Stated job (from map redesign)

> Show shelf coverage across curated worlds on a spatial atlas, with visible neighbor kinship, so Daniel can enter a world or warp in ≤2 clicks.

### Job audit

| Sub-job | Map delivers? | Already owned elsewhere? | Earns keep? |
|---------|---------------|--------------------------|-------------|
| Shelf coverage heat | Yes — gold/mist/hollow markers + counts | Hero legend + Atlas cards | **No as primary** — duplicate |
| Enter world ≤2 clicks | Yes — marker / focus Enter | Atlas doors (1 click), Mood chips, Archive | **No as primary** — slower path |
| Neighbor kinship / warps | Yes — edges + Warps strip | In-genre NeighborRail; Map `<details>` | **Yes — unique on hub** |
| Metaphor as geography | Yes — Reading Room / Threshold / … landmasses | Atlas card provenance line | **Partial** — spatial staging is richer than a label |
| “Recognize a map” | Yes (post-Chart) | — | Aesthetic win, not product job |

**Verdict:** The map answers a *real* job only if that job is **kinship orientation across the vault**. As a second enter-with-status catalog, it fails the usefulness test. Chart failed recognition; SVG fixed recognition and left the **redundancy** intact.

### Cognitive load (critique checklist, hub)

Visible choices before Map: 16 Atlas doors + ~36 mood chips + ~14 Archive chips + status chrome. **>>4** at the decision point. Failure count on progressive disclosure / choice overload: **critical**. Map then re-presents the 16 again.

---

## Hub vs Map redundancy

```
Hero (Worlds + status totals)
  └─ Atlas doors ────────── same 16 worlds, status, Enter
  └─ By mood ────────────── same worlds via feeling chips
  └─ Archive ────────────── leftover TMDB enter
  └─ Map ────────────────── same 16 worlds, status, Enter + warps
```

| Dimension | Atlas | Map | Redundant? |
|-----------|-------|-----|------------|
| Destinations | Curated worlds | Curated worlds | **Yes** |
| Status model | NICHE_THRESHOLD=6 | Same | **Yes** |
| Primary CTA | Whole-card Enter | Marker / Enter strip | **Yes** |
| Metaphor | Provenance label | Landmass + label | Soft overlap |
| Kinship edges | No | Yes | **Map-only** |
| Focus warps | No | Yes | **Map-only** |
| Placement | First content | Dead last | Map loses the job fight |

Hub IA plan *intentionally* mounted Map as closing atlas. That was correct for “leave with orientation” **only if** Atlas wasn’t already a complete catalog. It is. Closing gesture + duplicate catalog = ornament with a job statement.

In-genre: Map correctly demotes to `<details>Map</details>` under NeighborRail — proof the product already knows Map is secondary once you’re inside a room. Hub still treats Map as a peer section.

---

## Genre experience — does Worlds earn keep?

Entered **Horror** (filled, guided) and **Documentary** (sparse / era-deep).

| Surface | What it does | Earns keep? |
|---------|--------------|-------------|
| Guided tour + dials | Tempo / era / risk → reshape tonight shelf | **Yes** — watching decision |
| Tonight shelf | Concrete titles + watchlist/pass | **Yes** — aha moment |
| Closest in library | Personal anchors (Thing, Exorcist, …) | **Yes** — vault truth |
| Timeline / Featured / Argument | Depth once committed | **Yes** for filled worlds |
| NeighborRail | Warp to Thriller / Film Noir | **Yes** — kinship at point of use |
| Collapsed Map | Same SVG, embedded | Marginal — NeighborRail already warps |
| Hub Atlas | Choose which room | **Yes** — necessary index |
| Hub Map (peer) | Re-index + kinship | **Only kinship** — pack it, don’t stack it |
| Hub Mood alphabet | Feeling → world | Weak — thesaurus, not cinema habit |
| Hub Archive | Honest leftovers | Fine as footer |

**Onboard aha:** Not “I saw a map.” Aha is **tonight shelf shaped by dials inside a world I care about**. Hub’s job is get to that aha in one decisive enter — not teach three catalogs.

---

## How to pack atlas + map + entry into one viewport

**Goal:** One composition. Brand “Worlds.” One headline. One short line. One primary enter path. Spatial medium kept for aesthetics *and* kinship — without a second card grid.

### Target composition (first viewport)

```
┌─ WORLDS ──────────────────────────────────────────────────┐
│  Worlds                          Filled·1  Sparse·8  Empty·7 │
│  Rooms you already watch — pick a territory.                 │
├─ TERRITORY SURFACE (fills the fold) ───────────────────────┤
│  [ Metaphor landmasses + nodes + dim kinship edges ]         │
│                                                              │
│  Focus chrome (overlaid / docked, not a second catalog):     │
│    Horror · Threshold · Filled · 7                           │
│    [ Enter Horror ]     Warps: Thriller · Film Noir          │
└──────────────────────────────────────────────────────────────┘
```

### Distill rules

1. **Map becomes the Atlas** — territory SVG is the curated door surface. Kill the 16-card grid as peer content (or reduce to a compact “list view” toggle for power users, off by default).
2. **Focus strip = entry** — selecting a node *is* choosing a world; Enter is the only gold CTA in the fold.
3. **Status lives once** — legend on the map frame; no duplicate totals block elsewhere in fold.
4. **Mood demotes** — filter that highlights nodes / dims others, not 36 equal chips that navigate. Or cut from hub entirely; moods already live on world registers.
5. **Archive** — single quiet link or one-line remainder below the fold, not a pill cloud peer to Atlas.
6. **Keep aesthetics** — landmass fills, grain, gold on filled/active, Fraunces “Worlds,” Instrument Ink section voice. Do not flatten to a bare list to “simplify.” Cut the *second* catalog, not the material.
7. **In-genre** — keep NeighborRail primary; Map stays collapsed or becomes “vault overview” that jumps without re-teaching status.

### What this preserves from the plans

- Hub IA: hero brand-forward, status legend, curated vs archive honesty, alias dedupe.
- Map redesign: real geography, status marks, ≤2-click enter, kinship edges, no Chart lie.
- Impeccable elevate-never-dull: richer replace — one denser surface, not greyer emptiness.

### What this kills

- Peer section “Atlas” cards + peer section “Map.”
- Closing-gesture Map that restates doors.
- Mood-as-primary parallel IA (alphabet soup).

---

## Design health (product usefulness lens)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of status | 3 | Clear on doors *and* map — but told twice |
| 2 | Match real world | 2 | “Atlas” vs “Map” vs rooms — cinema metaphor overloaded |
| 3 | User control | 3 | Enter works; too many equivalent exits |
| 4 | Consistency | 2 | Same status model, three UIs |
| 5 | Error prevention | 3 | Empty marked; good |
| 6 | Recognition | 3 | SVG reads as map; Atlas cards don’t need to |
| 7 | Flexibility | 2 | Mood + Archive + Map + Atlas = flexibility without hierarchy |
| 8 | Aesthetic / minimal | 1 | Beautiful stack; not minimal product |
| 9 | Error recovery | 3 | Nav recoverable |
| 10 | Help / job clarity | 1 | Copy explains each section; product still asks “why both?” |
| **Total** | | **23/40** | **Useful parts, incoherent packing** |

**Anti-patterns verdict:** Not generic AI purple-slop. Fail is **feature-stack IA** — two good surfaces refusing to merge. Chart era was recognition fail (0/20 map test). Territory era is **product-job fail**.

### Persona red flags

**Daniel (builder-cinephile, density + honest labels):** Scrolls past Atlas, already knows Horror is filled, hits Map, thinks “I already picked.” Map warps unused because he’s entering, not touring. ⚠️ Redundant chrome tax.

**Jordan (first-timer):** Hero says rooms; Atlas looks like the product; Map at bottom looks like a second app. “Projection atlas” + “Atlas” + “Map” = vocabulary fog. ⚠️ Abandons before kinship value.

---

## Priority issues

1. **[P0] Atlas + Map are peer catalogs** — Same destinations, status, enter.  
   **Why:** Daniel asks “why does this exist?” even when it looks like a map.  
   **Fix:** One curated surface. Map-as-Atlas composition above.  
   **Command:** `/distill` then `/arrange`

2. **[P0] Unique map job (kinship) is not the hub’s first job** — Enter owns fold; warps are footer.  
   **Why:** Orientation arrives after the decision.  
   **Fix:** Put warps in the focus chrome of the primary surface; or accept NeighborRail-only and demote hub Map hard.  
   **Command:** `/onboard` (aha = enter world) + `/clarify`

3. **[P1] Naming collision — atlas / Atlas / Map** —  
   **Fix:** One word for the spatial surface (“Map” or “Atlas”, not both as sections). Hero can stay “Worlds.”  
   **Command:** `/clarify`

4. **[P1] Mood chip cloud** — Third enter factory; alphabet, not cinema.  
   **Fix:** Filter-on-map or cut from hub.  
   **Command:** `/distill` / `/quieter`

5. **[P2] In-genre Map vs NeighborRail** — Soft double.  
   **Fix:** Keep NeighborRail; Map overview only if it jumps the vault.  
   **Command:** `/distill`

---

## Synthesis — earn-keep scorecard

| Piece | Keep? | Role after pack |
|-------|-------|-----------------|
| Worlds hero | Keep | Brand + one whisper + status once |
| Atlas card grid | **Cut as peer** | Optional list toggle or gone |
| Territory SVG Map | **Keep as primary** | Entry + heat + kinship |
| Focus / Enter strip | Keep | Only gold enter in fold |
| Mood section | Demote or cut | Filter, not nav |
| Archive | Keep quiet | Footer honesty |
| GenreExperience | Keep | Product value lives here |
| NeighborRail | Keep | Point-of-use warps |
| In-genre Map details | Optional | Vault overview, not required |

**One-line roast:** The Chart wasn’t a map; the SVG is a map — and the hub still doesn’t need *both* a map and an atlas of the same sixteen doors. Pack entry into the territory surface, let kinship ride focus chrome, and send Daniel into Horror/Documentary where the product actually earns its keep.

---

## Out of scope

- Code changes  
- Git  
- GenreExperience module redesign beyond IA role calls  
- Live Don grilling questions (idea verdict recorded as CHALLENGE for Sit-Down / next pass)

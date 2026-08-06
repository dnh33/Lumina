# Worlds UX Roast — Information Architecture + Scroll Packing

**Agent:** Roast 1/4  
**Date:** 2026-08-06  
**Target:** `http://localhost:5173` (worktree `immersive-curated-genre-specific-experie`)  
**Lens:** IA, section stack, scroll packing — keep projection-booth / Worlds chrome / dark archive aesthetics  
**Method:** Live browser measure (Hub + Documentary Self/Guided + Horror Self/Guided) + code read of `GenreExperience`, `GenreModules`, `TimelineScrubber`, `GenrePicker`, `GuidedTour`. Skills: distill · quieter · arrange · systematic-debugging Phase 1. grill-with-docs located via `npx skills find grill` (domain grilling); roast grounded in measured section heights, not vibes.

**Viewport used for numbers:** ~1440×945 (desktop). “Screens” = `docHeight / viewportHeight`.

---

## Verdict

Worlds looks expensive and sounds like a vault. It *scrolls* like a catalog export that forgot it was a product UI.

The core bug is not “too much padding” or “hero is tall.” The core bug is **All eras renders the entire catalog as a 2/3-aspect poster grid with no viewport budget**. On Horror that single `#timeline-rail` is **~2.2 screens**. Everything else (Guided desk, Featured, Map, Hub Map) piles on top of that. You built a scrubber and shipped a warehouse.

| Surface | Screens | Dominant length driver |
|---------|---------|------------------------|
| Hub `/genre` | **3.31** | Atlas door grid (1.23) + WorldsMap (1.05) |
| Documentary Self (map collapsed) | **3.88** | Timeline grid 32 posters (~1.9) |
| Documentary Guided (map collapsed) | **4.49** | + GuidedTour (~0.5–0.6) on same warehouse |
| Horror Self | **4.24** | Timeline grid 40 posters (~2.2) |
| Horror Guided | **4.91** | + GuidedTour (~0.64) + same 40-poster grid |
| Documentary Self (Map *expanded*) | **4.92** | + embedded WorldsMap (~1.1) |

**Above-fold on Horror Guided:** Hero + Tour desk + Whisper + start of Anchors. The primary browse surface (Timeline) is **below the fold** after a full second cockpit. That is an IA failure, not a taste failure.

---

## Phase 1 — Root causes (named sections)

Treat scroll overwhelm as a bug. Measured causes, in order of impact:

### RC1 — `TimelineScrubber` “All eras” = unbounded poster grid (P0)

**Code:** `TimelineScrubber.tsx` — `#timeline-rail` is  
`grid grid-cols-3 … lg:grid-cols-6` with `aspect-[2/3]` cells, mapping **every** `visible` title.

| World | Posters in All eras | Grid height | Timeline section |
|-------|---------------------|-------------|------------------|
| Documentary | 32 | ~1.91 screens | ~2.09 |
| Horror | 40 | ~2.23 screens | ~2.41 |

Decade tabs *exist*, but default/restored “All eras” dumps the whole catalog vertically. There is **no nested vertical scroll**, no max-height, no “show more,” no sticky stage. Page scroll *is* the catalog.

**Why this hurts aesthetics too:** the booth chrome (grain, ghost numerals, gold tabs) sits above a Letterboxx-length poster dump. The vault feeling dies mid-scroll.

### RC2 — Linear stack of equal-weight modules after the rail (P0)

`GenreExperience` → `GenreModules` is a single `space-y-8` column. Nothing is staged; everything is always on.

**Horror Guided main children (measured):**

| # | Section | Screens | Role |
|---|---------|---------|------|
| 0 | `ExperienceHero` | 0.23 | World identity |
| 1 | `GuidedTour` | **0.64** | Session desk + Tonight shelf |
| 2 | `WhisperStrip` | 0.02 | State whisper |
| 3 | `AnchorFrame` (“Closest in your library”) | 0.14 | Seed titles again |
| 4 | Steer panel (search/sort/mode/media/tags/presets) | 0.14 | Full Self cockpit |
| 5 | `GenreModules` wrapper | **3.15** | Timeline + Featured + topics + directors + maker |
| 6 | `NeighborRail` | 0.10 | Warp |
| 7 | Map `<details>` (collapsed) | 0.05 | Territory (or +1.1 if open) |
| 8 | `ExportWorld` | 0.04 | Export |

Inside modules: Timeline **2.41** + Featured **0.43** + Also tagged **0.06** + Director index **0.07** + Maker **0.04**.

**Redundancy (same titles, multiple surfaces):** Tonight shelf (3) → Timeline (40) → Featured (1, often Tonight lead) → Maker (same director). Anchors also restate seeds already in the hero origin line.

### RC3 — Guided is additive, not a mode (P0)

`mode=guided` **inserts** `GuidedTour` above the Self stack. It does not replace Timeline / Featured / steer / Map. Result: two cockpits, one page, ~+0.6 screens, and the “guide” never owns the viewport.

### RC4 — Hub has four entry systems to the same doors (P1)

| Hub section | Screens | Count |
|-------------|---------|-------|
| HubHero | 0.28 | 1 |
| Atlas doors | **1.23** | 16 cards |
| By mood | 0.25 | **37** chips |
| Archive | 0.15 | 14 TMDB leftovers |
| WorldsMap | **1.05** | full territory canvas |

Atlas + Map both communicate shelf heat + entry. Mood is a third index over the same 16 worlds. Archive is a fourth. First viewport: hero + ~2 rows of doors — Map and most moods require scroll. Fine for an atlas *if* Map weren’t another full screen of the same product.

### RC5 — Expanded Map is a second full product (P1)

Genre-page Map `<details>` when open ≈ **1.08 screens** of `WorldsMap` (same canvas as hub). Collapsed is correct progressive disclosure; default-open (observed on Documentary during session) blows the page to ~5 screens.

### RC6 — Steer chip row scales with catalog noise (P2)

Horror steer shows ~14 genre tags + Surprise + Less well-known. Documentary ~9. Not the height villain (0.14 screens), but it **competes for attention** with era tabs and Guided dials — cognitive length, not just pixel length.

### RC7 — Aesthetic scale without packing budget (P2)

Hero ghost numeral + large display title + `space-y-8` + padded panels are on-brand. They become a problem **only because** RC1–RC3 refuse to constrain the catalog. Distill says: remove obstacles to the goal. The goal is “enter world → pick something tonight / browse an era.” The catalog grid *is* the obstacle.

---

## Brutal but fair

**Fair:** The chrome is good. Metaphor register, ghost count, era tabs with counts, Featured-as-one-thesis (post Aug-5 IA pass), collapsed Map, NeighborRail as warp — these are the right *kinds* of pieces. GuidedTour’s dial → Tonight shelf is the best object on the page when isolated.

**Brutal:** Calling a 40-poster CSS grid a “Timeline Scrubber” is false advertising. A scrubber implies a constrained rail and a moving window. You built a browse-all warehouse and put vault lighting on it. Guided does not guide; it **stack-ranks** a second UI on top of Self. The hub asks “how do you want to enter?” four times and then makes you scroll past empty Romance / Western / Anime doors to find the Map that answers the same question spatially.

Aug-5 IA redesign correctly killed multi-rail title restatement and made topics into facet chips. That win is now drowned by **All eras poster dump** — the density dial went to 11 on the wrong axis (vertical catalog) while leaving the session stage unbound.

---

## Packing proposals (keep aesthetics)

Constraint: ink theater, Fraunces/Public Sans, gold-as-signal, grain, material panels — **pack**, don’t grey-out or SaaS-tab-strip the soul.

### A. Sticky stage + scrollable catalog (primary fix)

**Idea:** Split the world into **Stage** (sticky / fixed viewport band) and **Archive** (scroll or internal scroll).

- Stage holds: compact world header (or collapsed hero), mode toggle, era tabs, optional Guided desk *or* Featured — one at a time.
- Archive holds: poster grid **inside a max-height panel** (`max-h-[min(70vh,720px)] overflow-y-auto`) with the same booth border/grain — feels like a projection tray, not infinite page.

**Preserve:** aspect posters, gold tabs, ring accents.  
**Kill:** page-length ∝ title count.

### B. Mode-owned surfaces (Guided vs Self)

| Mode | Owns viewport | Demotes / hides |
|------|---------------|-----------------|
| Guided | Tour desk + Tonight shelf + Featured thesis for shelf lead | Full Timeline (collapse to “Browse the vault” disclosure), Self tag soup, Surprise presets |
| Self | Era tabs + constrained Timeline + Featured | GuidedTour entirely |

Same chrome; different **package**. Progressive disclosure, not a second product.

### C. Decade-first default (not All eras dump)

Default `decade` to densest / most recent / anchor-bearing era (taste overlay already marks anchors). “All eras” becomes an explicit zoom-out that either:

1. switches to a **horizontal decade summary** (counts + 1–2 posters per era), or  
2. opens the internal-scroll tray (A), never an unbounded page grid.

### D. Dual-pane desktop (optional, on-brand)

Left (~40%): sticky Stage (hero whisper + Guided *or* Featured).  
Right (~60%): era tabs + scroll tray of posters.  
Mobile: Stage then tray as two stacked regions with `scroll-snap` — still one “room,” not five.

### E. Hub packing

- **Primary:** Atlas doors (keep) — tighten card height (tone line 1 line; drop redundant “Enter →”).
- **Map:** either replace Atlas *or* live as a toggle (“Doors | Territory”) — not both full height.
- **Mood:** collapse behind “Enter by mood” disclosure, or filter the Atlas in place (chips as filters, not a second destination list of 37).
- **Archive:** keep collapsed by default or footer-only.

### F. Merge micro-sections

- Fold `AnchorFrame` into hero as a quiet chip row (already have origin line).
- Fold Director index + Maker into Featured footer.
- Also tagged → into steer panel (it’s already a filter).
- Export stays footer; Map stays `<details>` **default closed**.

### G. Quieter scale (without dulling)

Per quieter skill: reduce **competing large blocks**, not gold or character.

- Hero: keep ghost numeral, trim vertical padding so Stage can share the fold with Guided *or* Timeline start.
- Featured: keep thesis; don’t restack another full TitleCard if Guided Tonight already showed that poster — link “Argue this pick” expand.

---

## Priority

### P0 — Must fix length

1. **Cap Timeline All eras** — internal scroll tray and/or decade-first default; stop `docHeight ∝ N titles`.
2. **Mode-owned IA** — Guided replaces the Self warehouse; Self doesn’t carry GuidedTour.
3. **Featured placement** — attach to Stage / beside lead pick; never 2+ screens below the Tonight shelf.

### P1 — Pack the package

4. Hub: **one** spatial index (Map **or** Atlas full), mood as filter/disclosure.
5. Genre Map: force default collapsed; don’t rehydrate open from stray state.
6. Dual-pane or sticky Stage so first viewport always contains identity + primary action + some titles.

### P2 — Polish density

7. Fold Anchors / directors / maker / also-tagged into Stage chrome.
8. Trim steer tag sprawl (top-N tags + “more”).
9. Tighten Atlas door card vertical padding without killing metaphor line.

---

## Success criteria (verifiable)

| Check | Target |
|-------|--------|
| Horror Guided `docHeight / vh` | **≤ 2.0** with Map collapsed |
| Horror Self All eras | Timeline grid **≤ 0.9 vh** (internal scroll OK) |
| First viewport Guided | Desk + ≥1 Tonight poster + path to Featured without scrolling past warehouse |
| Hub | Atlas doors fully usable by ~1.5 screens; Map not a mandatory second screen |
| Aesthetics | Same tokens, grain, gold hierarchy — denser *composition*, not greyer UI |

---

## Evidence appendix

### Code smoking guns

- `TimelineScrubber.tsx` ~L232–272: unbounded `visible.map` into aspect poster grid.
- `GenreExperience.tsx` ~L421–676: Hero → GuidedTour? → Whisper → Anchors → Steer → GenreModules → Neighbors → Map → Export.
- `GenreModules.tsx`: Timeline → Featured → Topic → Directors → Maker (always vertical).
- `GenrePicker.tsx`: HubHero → Atlas → MoodEntry → Archive → WorldsMap.

### Live measurements (2026-08-06, ~945px vh)

```
Hub:                 3.31 screens  | Atlas 1.23 | Map 1.05 | moods 37
Doc Self:            3.88          | grid 1.91 (32) | featured 0.43
Doc Guided:          4.49          | +tour ~0.53
Horror Self:         4.24          | grid 2.23 (40) | timeline 2.41 | modules wrap 3.15
Horror Guided:       4.91          | +tour 0.64 | same grid
Doc Self Map open:   4.92          | Map details 1.08
```

### Distill / quieter / arrange read

- **Distill:** One goal per mode (tonight pick vs era browse). Warehouse + desk + featured + map = four goals.
- **Quieter:** Intensity isn’t gold — it’s **scale stacking** (hero + desk + full grid + featured). Quiet the stack; keep the booth.
- **Arrange:** Rhythm is monotone `space-y-8` sections. Need tight grouping inside Stage, hard separation before Archive tray — not equal gaps forever.

---

## Out of scope

No implementation in this pass. No git. Interaction/cognitive detail owned by Roast 3/4; this doc owns **height math + packing architecture**.

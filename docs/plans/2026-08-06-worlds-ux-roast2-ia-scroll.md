# Worlds UX Roast 2 — IA + Scroll Packing (POST packing wave)

**Agent:** Roast 1/4 (pass 2)  
**Date:** 2026-08-06  
**Target:** `http://localhost:5173` (worktree `immersive-curated-genre-specific-experie`, server restarted)  
**Viewport:** 1440×945 — `folds = docHeight / vh`  
**Lens:** distill · quieter · arrange · systematic-debugging Phase 1  
**Compared to:** Roast 1 (`2026-08-06-worlds-ux-roast-ia-scroll.md`) + scoreboard (`2026-08-06-worlds-packing-scoreboard.md`)  
**Evidence:** live agent-browser DOM measure after restart. No code in this pass.

---

## Verdict

**Packing stuck.** Mode-split length math is real, not HMR theater. The warehouse that owned Roast 1 is gone: `#timeline-rail` is a capped tray on Self and **absent** on Guided Claim. Hub is one-fold atlas again.

**Still not done.** Length targets mostly PASS; **first-fold job** often FAIL. Self still scrolls ~2.1–2.2 folds because Featured + argument + footer chips are a second product under the tray. Guided Claim fits ≤2.0 but crams **desk + shelf + Featured + argument** into one viewport — five H2/H3 signals above the fold. That is packing without IA discipline.

| Surface | Roast 1 | Live now | Δ | Target | Length | Squint (1 job?) |
|---------|---------|----------|---|--------|--------|-----------------|
| Hub `/genre` (doors/mood closed) | 3.31 | **1.228** (docH 1160) | −2.08 | one-fold | **PASS** | **PASS** — territory |
| Hub doors+mood **open** | — | **2.523** (docH 2384) | — | still disclosures | stress | **FAIL** — map + door warehouse |
| Horror Self `?decade=2010s` | 4.24 | **2.133** (docH 2016) | −2.11 | ≤3.5 | **PASS** | **WEAK** — browse only; Featured below fold |
| Documentary Self `?decade=2010s` | 3.88 | **2.242** (docH 2119) | −1.64 | ≤3.5 | **PASS** | **WEAK** — same |
| Horror Guided Claim | 4.91 | **1.434** (docH 1355) | −3.48 | ≤2.0 | **PASS** | **FAIL** — claim + argue stacked |
| Documentary Guided Claim | 4.49 | **1.475** (docH 1394) | −3.02 | ≤2.0 | **PASS** | **FAIL** — same stack |

**Tray check:** Horror + Doc Self `#timeline-rail` = **402px ≈ 0.425 vh** (≤0.9 target). `decade=all` remaps to preferred decade (2020s observed) — page length stays ~2.06, not catalog-proportional. Guided Claim: rail **null**. Widen CTA present.

---

## Squint test (first fold = one job?)

### Hub — PASS

Above fold: `Worlds` + map + collapsed Door list / By mood summaries. Job: **pick a territory**. Map ~0.70 vh. Archive sits below the fold as footer chips. Correct composition.

**Trap:** open `#doors` and the atlas grid returns as a **1.11 vh** peer under the map → total **2.523**. Disclosure is progressive in name only; open state is still a second catalog product (`GenrePicker.tsx` `HubDisclosure` + door grid).

### Self (Horror + Documentary) — WEAK / half-pass

Above fold: world title + Timeline (era tabs + tray start). Job should be **browse this era**. That job is on stage — good.

Featured starts at **y ≈ 1117** (Horror) / **1159** (Doc) — **below the fold**. So the inspect thesis is a second scroll job, not co-located with the tray pick. First fold is one job only if you accept “browse without inspect.” Users who tap a poster still get argue/maker/neighbors/export as a monotone `space-y-6` column (`GenreModules.tsx`).

### Guided Claim — FAIL

Above fold (Horror): `Horror` · `The door is chosen` · `Tonight shelf` · `Featured` · `The argument` — **five** heading signals. Tour section alone ≈ **997px / 1.06 vh**. Job should be **claim tonight**. Instead the fold also demands **argue the thesis**. Tonight shelf posters + Featured TitleCard restates the lead. Distill fails: two goals, one viewport.

---

## What packing fixed (credit, brief)

1. **Self tray** — page height decoupled from N titles. Roast 1 RC1 (unbounded All-eras grid) is dead at measured path.
2. **Guided owns Claim** — no timeline warehouse under dials (`GenreExperience.tsx` guidedWiden / stage gating). Mode-split B sniff holds after restart.
3. **Hub map-first** — doors/mood demoted to closed `<details>` (`GenrePicker.tsx` ~L321–371). Default **1.228** matches scoreboard.
4. **Decade-first bias** — `decade=all` does not dump 40 posters page-tall; preferred decade tray stays ~0.43 vh.

---

## Remaining length / IA debt (named)

### RC1 — Featured + Argument is the new length villain (P0)

**Where:** `GenreModules.tsx` Featured block (~L194–248) + `ArgumentPanel.tsx`; Self stack in `GenreExperience.tsx` mode-stage.

| Piece | Horror Self folds | Notes |
|-------|-------------------|-------|
| Timeline section | 0.74 | tabs + copy + tray |
| `#timeline-rail` | **0.43** | capped — fixed |
| Featured block | **0.43** | TitleCard + chrome |
| The argument | **0.24** | thesis panel |
| Also tagged / Filmmakers / Maker / Neighbors / Export | ~0.3 combined | footer soup |

Self is **~2.1 folds** not because of posters — because inspect chrome under the tray equals another half-screen product. On Guided Claim, Featured is *inside* the first fold and fights the shelf.

**Arrange read:** tight tray grouping, then hard separation before Archive — you still run equal `space-y-6` after the tray. Rhythm is “section, section, section.”

### RC2 — Guided Claim first fold is two cockpits (P0)

**Where:** `GuidedTour.tsx` + claim-stage `GenreModules` (`stage === "claim"`) in `GenreExperience.tsx` ~L799–840.

- Desk + Tonight shelf = claim job.
- Featured + Argument + Maker under shelf = argue job.
- Same lead title appears on shelf **and** as Featured card.

Length PASS (1.43–1.48) hides IA FAIL. Quieter skill: intensity is scale-stacking of large blocks, not gold.

### RC3 — Self footer still lists every leftover module (P1)

**Where:** `GenreModules.tsx` TopicCluster / director index / MakerSpotlight; `GenreExperience.tsx` NeighborRail + ExportWorld.

Also tagged · Filmmakers · Maker · Neighboring worlds · Export — individually small (~0.04–0.07), collectively a **second scroll of low-value chips** after Featured. Roast 1 F/G proposals not done. Cognitive length > pixel length.

### RC4 — Hub door disclosure re-inflates to warehouse (P1)

**Where:** `GenrePicker.tsx` `#doors` grid (`sm:grid-cols-2 lg:grid-cols-3` WorldDoor cards).

Closed: PASS. Open: **+1.11 vh** doors alone, page **2.523**. Map + full atlas again = Roast 1 hub dual-index, gated behind one click. Progressive disclosure that expands to a full product is not packing — it’s postponement.

### RC5 — Steer tag sprawl still on Self chrome (P2)

**Where:** steer panel in `GenreExperience.tsx`.

Horror: Action…Fantasy + “+6 more” + Surprise / Less well-known above Timeline. Not the height driver (~chrome before Timeline y=413). Still competes with era tabs for attention on the browse fold.

### RC6 — Guided Widen not re-roasted as default path (P2 / watch)

Claim stage parks the rail correctly. Widen → browse tray path exists (`data-testid="guided-browse-tray"`). If Widen re-attaches full Self footer under Claim chrome, length regresses. Not measured as default load; flag for interaction roast.

---

## Priority

### P0 — IA debt that survives the length PASS

1. **One job on Guided Claim fold** — Claim = desk + Tonight shelf + claim CTAs. Demote Featured/Argument behind “Argue this pick” / deepen, or replace shelf lead card with the thesis so TitleCard isn’t restated. Files: `GuidedTour.tsx`, `GenreModules.tsx` (`stage === "claim"`), `GenreExperience.tsx` claim branch.
2. **Self: co-locate inspect with tray** — Featured must not start at y>vh while tray is the fold job; dual-pane (tray | inspect) or sticky inspect under selection. Kill the “scroll past tray to argue” rhythm. Files: `GenreExperience.tsx` Self layout ~L904–909, `GenreModules.tsx`.

### P1 — Pack the leftovers

3. **Collapse Self footer modules** into Stage chrome / Featured footer (Also tagged → steer; Filmmakers+Maker → Featured; Neighbors/Export stay footer-thin). Files: `GenreModules.tsx`, `GenreExperience.tsx`.
4. **Hub doors open budget** — open state should not restore a 1+ vh card warehouse; denser list or filter-the-map, not peer atlas. File: `GenrePicker.tsx` door grid inside `HubDisclosure`.

### P2 — Cognitive density

5. Cap steer tags (top-N + more) on Self chrome. File: `GenreExperience.tsx` steer panel.
6. Verify Guided Widen does not reintroduce Claim+warehouse stack. Files: `GenreExperience.tsx` `guidedWiden` branch.

---

## Success criteria (re-verify)

| Check | Target | Live |
|-------|--------|------|
| Hub default folds | ≤1.5 / one-fold atlas | **1.228 PASS** |
| Horror/Doc Self folds | ≤3.5 | **2.13 / 2.24 PASS** |
| Self `#timeline-rail` | ≤0.9 vh | **0.425 PASS** |
| Guided Claim folds | ≤2.0 | **1.43 / 1.48 PASS** |
| Guided Claim rail | absent | **null PASS** |
| Hub first fold one job | territory only | **PASS** (doors closed) |
| Self first fold one job | browse *or* browse+inspect co-located | **WEAK** — Featured below fold |
| Guided first fold one job | claim tonight only | **FAIL** — claim+argue |

---

## Evidence appendix

### Live measures (2026-08-06, vh=945, after restart)

```
Hub default:           folds 1.228  docH 1160  map 660 (0.698)  doors/mood closed
Hub doors+mood open:   folds 2.523  docH 2384  doorsH 1050  mapH 660
Horror Self 2010s:     folds 2.133  docH 2016  rail 402 (0.425)  Featured y=1117 (below fold)
Horror Self all→2020s: folds 2.062  docH 1949  rail 402 (0.425)  (preferred decade, not dump)
Doc Self 2010s:        folds 2.242  docH 2119  rail 402
Horror Guided Claim:   folds 1.434  docH 1355  rail ABSENT  tour≈997px  aboveFold: 5 headings
Doc Guided Claim:      folds 1.475  docH 1394  rail ABSENT  aboveFold: 5 headings
```

### Mode copy observed

- Self: `Self mode. Browse tray on stage.`
- Guided Claim: `Guided mode. Claim cockpit on stage.` + Widen CTA `Widen and browse the archive tray`

### Skills read

- **Distill:** Packing removed the catalog obstacle; remaining obstacle is **dual goals per mode** (browse vs argue; claim vs argue).
- **Quieter:** Gold/grain fine. Loudness = stacked large blocks (desk + Featured) on Claim.
- **Arrange:** Hub rhythm works (tight disclosures under map). Self/Guided still monotone section stacking after the primary instrument.

### Out of scope

No implementation. Interaction/cognitive detail → Roast 3/4. Visual taste → Roast visual. This doc owns **post-pack vh math + first-fold IA**.

---

## One-line scoreboard vs ship targets

**Length: packing stuck. IA: first fold still argues with itself on Guided; Self still makes you scroll to inspect.**

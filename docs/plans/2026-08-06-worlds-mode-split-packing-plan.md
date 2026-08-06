# Worlds Mode-Split Packing Plan

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Status:** ADR-ready · **Q1 locked = B Mode-split** · **North star = game-HUD composition**  
**Scope:** Packing architecture + implementation waves only. No product code in this pass.  
**Preserve:** Projection-booth / Instrument Ink Worlds chrome — grain, gold-as-signal, world-edge needles, Cabinet+Geist (or declared display stack), dial desk, territory map craft. Pack denser; never grey-out or SaaS-tab the soul.

**Sibling composition brief:** [`2026-08-06-worlds-game-hud-composition-brief.md`](./2026-08-06-worlds-game-hud-composition-brief.md) — panel density, HUD regions, anti-marketing-scroll. *(Create/open when authored; this plan owns Mode-split B + waves; the brief owns visual/IA composition language.)*

**Sources (all present in this worktree `docs/plans/`):**

| Roast | File |
|-------|------|
| IA + scroll | `2026-08-06-worlds-ux-roast-ia-scroll.md` |
| Visual taste | `2026-08-06-worlds-ux-roast-visual-taste.md` |
| Interaction / Guided | `2026-08-06-worlds-ux-roast-interaction.md` |
| Product / Map+Hub | `2026-08-06-worlds-ux-roast-product-map.md` |
| Grill-with-docs | `2026-08-06-worlds-ux-roast-grill-with-docs.md` |

**Lock — Mode-split B:** Daniel answered grill **Q1 = B Mode-split** — Self first viewport = browse; Guided first viewport = claim; mode flip **re-stages** the page (does not stack cockpits). This is the product law; game-HUD is how it *composes*.

---

## 0. North star — game-HUD IA (not marketing scroll)

Daniel’s packing north star: composition like **CP2077 / GTA in-game browsers** — dense panels, mode stages, inventory/map/journal as **regions of one HUD**, not a long landing-page scroll. **Structure, not cosplay** — borrow IA density and stage ownership; keep Worlds booth chrome (no neon cyberpunk skin, no GTA map rip-off).

| Game-HUD move | Worlds application (Mode-split B) |
|---------------|-----------------------------------|
| One screen, many panels | Stage owns a **panel set**; overflow scrolls *inside* a tray, not the whole document |
| Mode / tab swaps the HUD | Self ↔ Guided **re-stages** panels (browse tray vs claim desk) — never stack both full cockpits |
| Map / journal / inventory are exclusive primaries | Hub: one fold entry (map-as-atlas *or* doors); Genre: claim *or* browse primary |
| Detail panes dock to selection | Featured = expansion of shelf/selected lead — not a section three screens down |
| Long scroll = failure | Success = panel density in ~1–2 folds; warehouse poster dump is out |

**Anti-pattern:** marketing/product-site scroll (hero → feature stack → feature stack). Roasts measured that failure live; Mode-split B + HUD packing kill it.

**Division of docs:** this plan = Mode-split B stages + waves + verify. Composition brief (sibling) = HUD region map, density dials, panel chrome rules. Implementers read both.

---

## 1. Consensus from all roasts

Five independent lenses, one diagnosis.

### 1.1 Scroll is a packing bug, not a padding bug

| Cause | Evidence | Roasts |
|-------|----------|--------|
| **RC1 — All-eras unbounded poster grid** | Horror `#timeline-rail` ≈ **2.2 screens** / 40 posters; `docHeight ∝ N titles` | IA, grill |
| **RC2 — Equal-weight linear stack** | Hero → Guided? → Whisper → Anchors → Steer → Timeline → Featured → … always on | IA, interaction, grill |
| **RC3 — Guided bolted on** | `mode=guided` **inserts** desk atop Self warehouse (+~0.6 screen); does not replace | IA, interaction, grill, product |
| **RC4 — Hub Atlas + Map peer catalogs** | Same 16 worlds, status, Enter — Map buried after Mood+Archive | IA, product, grill |
| **RC5 — Map remount in-genre** | Expanded `<details>` ≈ +1 screen of same SVG | IA, grill |
| **Era triple-clock** | Dial era + decade scrub + whisper can disagree | Interaction |
| **Featured archaeology** | Thesis ~3–4 viewports below Tonight shelf; same lead twice | Interaction, grill |
| **Visual density bipolar** | Gallery air on heroes/doors vs pill soup on mood/tags; gold inflation | Visual |

**Live length (≈945px vh, 2026-08-06):** Hub ~3.3 · Horror Self ~4.2–4.4 · Horror Guided ~4.9–5.1.

**What is *not* the primary bug:** booth aesthetics, Guided dial object quality, territory-SVG recognition (Chart era fixed), Aug-5 carousel cut. Those stay.

### 1.2 Hub: atlas + map duplication

Product roast distilled the “What map?” failure to **job collision**, not missing pixels:

- Atlas doors and Map both answer: status + enter curated world.
- Map’s **unique** job is kinship / territory orientation.
- Stacking Atlas + Map as peer sections fails usefulness; one surface must own entry.

**Consensus pack:** One first-fold entry composition — **map-as-atlas** (territory SVG primary) *or* Atlas doors primary with Map demoted (toggle / footer / link). Mood = filter or disclosure, not a third door factory. Archive = quiet footer. One status legend per surface.

### 1.3 Guided is bolted on, not a mode

Genre IA left Guided as “unchanged mount under hero.” That is additive length by construction and **conflicts with G1** (Guided in ship criteria) + genre V1 browse job.

**Consensus pack (now locked by Q1-B):**

| Mode | Owns first viewport | Must not show as full cockpit |
|------|---------------------|-------------------------------|
| **Self** | Browse: hero + session chrome + steer + **timeline tray start** | GuidedTour desk |
| **Guided** | Claim path: hero + tour desk + Tonight shelf (± Featured expansion) | Full Self steer + unbounded timeline warehouse |

Flip Self ↔ Guided **re-stages** surfaces (park / unpark), not “add a panel.”

### 1.4 Visual taste constraints on packing (do not violate while cutting)

From visual roast — packing PRs must not “quiet” into greyer SaaS:

- Keep carbon + grain + booth geometry.
- Fix display font wiring (`font-display`) when touching titles — separate small wave OK.
- Gold jobs ≤3 per viewport; don’t strip character to shorten scroll.
- Mood/tag chip clouds are length *and* taste failures — cap/group, don’t restyle as more pills.
- Map chroma: keep territory craft; retint indigo Constellation off purple family when Map is primary (Wave hub).

### 1.5 Grill defaults still recommended (unlocked by Q1; others pending soft)

Until Daniel overrides: **Q2-A** hub-only atlas (in-world = NeighborRail + optional “Open atlas” link); **Q3-A** Featured = shelf-lead expansion; **Q6-A** full Self cockpit only on Widen / Browse stage. This plan implements those as defaults.

---

## 2. Mode-split packing architecture (Q1 = B + game-HUD)

**Mode-split B** is the locked product decision. **Game-HUD** is the composition model that makes B feel like a session cockpit, not a brochure with a tour bolted on. See §0 and the sibling [game-HUD composition brief](./2026-08-06-worlds-game-hud-composition-brief.md).

### 2.1 Law

**One primary surface per stage** — HUD language: one active panel cluster. Everything else is parked (collapsed cue, disclosure, internal-scroll tray, or route) — not stacked at equal weight down a marketing column.

Mode flip = **HUD re-stage** (stage machine reset to that mode’s entry stage), not “insert another section.”

### 2.2 Guided stages — SEED → DIAL → CLAIM → (DEEPEN) → BROWSE

```
SEED → DIAL → CLAIM → DEEPEN? → BROWSE
(empty) (0–2)  (3/3)   (opt)     (Self tools / Widen)
```

| Stage | On stage (primary) | Parked / demoted | Exit when |
|-------|--------------------|------------------|-----------|
| **SEED** | Empty metaphor + ≤5 affinity adds; media + mode in thin session chrome | No dial sheet; no full timeline; Companion optional whisper only | ≥1 library anchor **or** explicit “Tour cold” |
| **DIAL** | Tour desk: needle + one beat + preview shelf (actions muted or Watchlist-only) | Self steer, tags, Surprise, Featured body, Export, Map SVG, modules | Beat answered; 3/3 → CLAIM |
| **CLAIM** | Tonight shelf three as hero outcomes; **Featured thesis inline under lead**; Whisper confirms ranking | Timeline = “Widen eras” disclosure/tray; steer in “Tune”; Companion closed by default | Watchlist / Pass / Open **or** “Widen room” |
| **DEEPEN** | Companion opens shelf-bound (defend/narrate the three) | Free-roam fourth-title suggest | Close Companion or “Browse freely” |
| **BROWSE** | Full Self chrome + constrained Timeline tray + modules + Neighbors + Export; desk collapses to compact needle/status chip | Full dial sheet | Mode → Self, or Retake → DIAL |

**Era authority:** During DIAL/CLAIM, **dial owns era**. Decade scrub disabled or soft-peek without forking shelf; scrubbing a decade = explicit re-dial with confirmation. Whisper must not say “every era” after Classic without qualifier.

### 2.3 Self — browse tray (no Guided desk)

```
ENTER (hero + session chrome: Self|Guided · Movies|TV)
  → BROWSE STAGE
     Whisper (compact)
     Steer (search/sort/media/tags — tags capped / world-relevant)
     Timeline: decade-first + internal-scroll tray
     Featured (deep dive for selected / era lead)
     Secondary modules (topics / directors / maker — below or tabbed)
  → LEAVE
     NeighborRail
     Export
     Map: link to hub atlas OR collapsed details (prefer link if Q2-A)
```

**AnchorFrame:** Default demote out of V1 (whisper evidence or under Featured). Empty/niche may keep seed strip as SEED-equivalent on Self.

### 2.4 Session chrome (both modes)

Always reachable (fixes niche Path E trap):

- Self | Guided  
- Movies | TV  
- Compact world identity (hero may shrink when Guided desk owns V1)

Mode toggle lives **in session chrome**, not buried under the tour that already declared Guided.

### 2.5 Re-stage on flip

| From → To | Behavior |
|-----------|----------|
| Self → Guided | Park timeline warehouse + full steer; mount desk at stage SEED or DIAL (from session state); restore dial progress |
| Guided → Self | Unmount/collapse desk to chip; restore browse tray + steer; preserve decade URL if present |
| Guided Claim → Widen | Enter Guided BROWSE without leaving mode — unlock tray |

---

## 3. Timeline — internal scroll tray / decade-first

**Stop:** `All eras` as unbounded page-length poster dump (`TimelineScrubber` mapping every `visible` title into `aspect-[2/3]` grid that grows the document).

**Ship:**

1. **Decade-first default** — land on densest / most recent / anchor-bearing decade (taste overlay can bias anchors). Not All-eras.
2. **All eras** becomes explicit zoom-out that either:
   - **Horizontal decade summary** (counts + 1–2 posters per era), or  
   - Opens the **internal-scroll tray** — never unbounded page grid.
3. **Tray packing (game-HUD inventory):** poster grid inside booth-chrome panel with `max-h` ≈ `min(70vh, 720px)` + `overflow-y-auto` — projection tray / in-panel browser, not page warehouse. Page scroll length **decoupled from title count**. Same idea as scrubbing a dense in-game list without scrolling the whole pause menu off-screen.
4. Preserve: gold era tabs with counts, aspect posters, ring accents, ghost/grain on the tray frame.

**Guided DIAL/CLAIM:** Timeline not in V1; available only as Widen → tray.

**Self V1:** Tray **start** (header + first rows) visible in first viewport after steer — AnchorFrame must not push posters out.

---

## 4. Hub — one-fold entry

### 4.1 Target composition (preferred: map-as-atlas)

```
┌─ WORLDS ──────────────────────────────────────────────────┐
│  Worlds · one status legend (Filled · Sparse · Empty)     │
│  One short line — rooms you watch; pick a territory.        │
├─ TERRITORY SURFACE (owns the fold) ───────────────────────┤
│  Metaphor landmasses + nodes + dim kinship edges            │
│  Focus chrome: world · metaphor · status · count            │
│  [ Enter {World} ]   Warps: neighbor · neighbor             │
└────────────────────────────────────────────────────────────┘
```

**Rules:**

1. Territory SVG is the curated door surface (entry + heat + kinship).
2. **16-card Atlas grid** is not a peer section — optional list-view toggle off by default, or gone.
3. Focus strip = entry; one gold Enter in the fold.
4. Mood = filter highlighting nodes (or disclosure ≤ curated moods), not ~36 alphabet chips navigating.
5. Archive = footer honesty / one quiet link.
6. Naming: one word for the spatial surface (“Map” *or* “Atlas”), not both as peer H2s. Hero brand stays “Worlds.”

### 4.2 Acceptable alternate (if map-as-atlas slips schedule)

Atlas doors remain primary V1; Map demotes to toggle (“Doors | Territory”) or closing disclosure **without** full second catalog height always mounted. Same distill rule: **one** spatial/index catalog at a time.

### 4.3 In-genre Map

Prefer **Q2-A:** do not remount full WorldsMap; NeighborRail owns warps; optional “Open vault atlas” → hub `#map`. If `<details>` kept temporarily, **force default closed**; never rehydrate open from stray state.

---

## 5. Ordered implementation waves

Each wave: goal → touch surface → verify. No speculative refactors outside the verify row.

### Wave 0 — Decisions freeze (docs only)

| Item | Value |
|------|-------|
| Q1 | **B Mode-split** · LOCKED |
| North star | **Game-HUD composition** (CP2077 / GTA in-game browser IA — structure not cosplay) · LOCKED by Daniel |
| Composition brief | [`2026-08-06-worlds-game-hud-composition-brief.md`](./2026-08-06-worlds-game-hud-composition-brief.md) (sibling; author if missing) |
| Q2 | Default **A** hub-only atlas (confirm or override before Wave 4) |
| Q3 | Default **A** Featured = shelf expansion |
| Q4 | Default **A** AnchorFrame out of filled V1 |
| Q5 | Default **A** mood capped/grouped/disclosure |
| Q6 | Default **A** Widen unlocks Browse |
| Q7 | Stretch: Self ≤3.5 vh; Guided Claim ≤2.0 vh (Map collapsed / linked out) |

**Verify:** This plan + game-HUD brief accepted; sibling roast paths cited; no code yet.

---

### Wave 1 — Timeline tray + decade-first (P0 length)

**Goal:** Kill `docHeight ∝ N titles` on Self (and on Guided once Widen exists).

**Changes (conceptual):**

- Default decade ≠ All eras.
- Poster grid in max-height internal scroll tray.
- All-eras zoom-out = summary or tray-only, not page dump.

**Verify:**

| Check | Target |
|-------|--------|
| Horror Self All-eras (or densest decade) timeline grid height | **≤ 0.9 vh** (internal scroll OK) |
| Horror Self `docHeight / vh` | trending toward **≤ 3.5** with Map collapsed/linked |
| Aesthetics | Same booth chrome on tray; posters still 2/3 |

**Small test after:** Open Horror Self → confirm decade default → switch All eras → page length does not jump by ~2 screens.

---

### Wave 2 — Mode-owned IA + Guided stages (P0)

**Goal:** Guided replaces Self warehouse in Dial/Claim; Self never mounts GuidedTour.

**Changes (conceptual):**

- Stage machine: SEED → DIAL → CLAIM → DEEPEN? → BROWSE.
- Dial/Claim: park Self steer + timeline; Featured inline under shelf lead.
- Empty: SEED before dial sheet.
- Session chrome always shows mode/media.
- Mode flip re-stages.

**Verify:**

| Check | Target |
|-------|--------|
| Guided Dial primary decisions | **≤ 4** (beat choices) |
| Guided Claim first viewport | Desk + ≥1 Tonight poster + path to Featured **without** scrolling past warehouse |
| Horror Guided `docHeight / vh` (Claim, Map out) | **≤ 2.0** |
| Featured vs shelf | Thesis within **1 scroll** of lead (inline preferred) |
| Empty + Guided | Never equal-weight dial sheet + seed strip |
| Era | Dial and scrub never silent-disagree |
| Niche/empty | Movies/TV + Self/Guided always reachable |

**Small test after:** Documentary Guided 3/3 → Claim viewport; flip to Self → desk gone, tray present; flip back → stage restored.

---

### Wave 3 — Hub one-fold entry (P1)

**Goal:** One enter composition; kill Atlas+Map peer duplication.

**Changes (conceptual):**

- Map-as-atlas (preferred) **or** Atlas primary + Map toggle/demote.
- Mood disclosure / filter / cap.
- Archive footer.
- One status legend.
- Naming cleanup (Atlas vs Map).

**Verify:**

| Check | Target |
|-------|--------|
| Hub first fold | Brand + one enter path (territory **or** doors) usable without scrolling a second catalog |
| Hub total | Atlas/Map combined not two full ~1-screen peers; mood/archive ≤1 vh combined after primary **or** collapsed |
| Kinship | Warps visible in focus chrome of primary surface |
| Aesthetics | Territory craft kept; no purple Constellation; gold Enter once in fold |

**Small test after:** Cold load `/genre` → enter Horror in ≤2 clicks from fold; no need to scroll past Mood to find Map *as a second catalog*.

---

### Wave 4 — In-genre leave path + Map ownership (P1)

**Goal:** Canonical atlas on hub; in-world orientation = Neighbors.

**Changes (conceptual):**

- Remove or hard-demote in-genre full WorldsMap (link to hub `#map`).
- NeighborRail stays.
- Export footer.

**Verify:**

| Check | Target |
|-------|--------|
| Genre page | Never mounts second full atlas by default |
| Open Map details (if residual) | Default closed; +height not on cold load |
| Guided Claim | No map chrome in V1 |

**Small test after:** Horror Guided Claim length unchanged when Neighbors visible; “Open atlas” lands hub map.

---

### Wave 5 — Companion + era contracts (P1)

**Goal:** One curator during Claim; whisper/era honesty.

**Changes (conceptual):**

- DEEPEN after Claim (or after one shelf act).
- Companion during Claim = shelf-bound; label “beyond tonight” if escaping.
- Whisper copy matches dial authority.
- Kill Featured caption that admits duplicate ranking without co-location (done in Wave 2 if inline).

**Verify:**

| Check | Target |
|-------|--------|
| Companion @ Claim | No unlabeled fourth title as “on tonight’s shelf” |
| Whisper after Classic | No bare “every era” |
| Prefill | Still carries dials |

**Small test after:** Path B from interaction roast — Companion open on complete Guided — shelf and reply agree or are explicitly beyond tonight.

---

### Wave 6 — Density / taste polish (P2; parallel-safe after Wave 2)

**Goal:** Beautiful density without reopening packing law.

- `/typeset` — `font-display` on Worlds titles.
- `/quieter` — gold job budget; mist reg-ticks.
- Atlas asymmetry if doors remain (filled denser).
- Steer tag top-N + More.
- Fold micro-sections (directors/maker into Featured footer; Also tagged into steer).
- Map chroma retune if Wave 3 made Map primary.

**Verify:** Visual roast P0s addressed; packing metrics from Waves 1–2 still green (no regression to warehouse).

---

## 6. Preserve Worlds aesthetics (non-negotiable)

Game-HUD IA ≠ cyberpunk cosplay. Density and stage ownership from CP2077/GTA **browsers**; material language stays Instrument Ink / booth.

| Keep | Kill / avoid |
|------|----------------|
| Carbon ink, grain, mist neutrals | Greying “to quiet” |
| Tour desk as physical booth controls | Wizard steppers / SaaS tabs as soul |
| Gold as earned signal (rationed) | Gold on every chrome edge |
| Territory landmasses + warps | Chart lie; peer double catalog |
| Aspect posters, era tabs, needle | Unbounded page poster dump / marketing scroll |
| World-edge needle on doors | Equal empty card gallery air as the only rhythm |
| Instrument Ink type jobs (display / sans / mono) | Inter/Roboto; purple haze; cream-terracotta craft; Sparkles-as-AI |
| Panel density (HUD) | Neon overlays, fake “hacker terminal,” GTA/CP texture rip |

**Principle:** Pack by kinship and stage (HUD regions); air is a spotlight on **one** hero moment per viewport (shelf *or* map focus *or* filled door) — not watermark + H1 + legend + FAB + desk + warehouse.

---

## 7. Success scoreboard (ship packing)

| Surface | Metric | Pass |
|---------|--------|------|
| Horror Guided Claim | `docHeight / vh` | ≤ 2.0 |
| Horror Self | Timeline tray height | ≤ 0.9 vh |
| Horror Self page | `docHeight / vh` | ≤ 3.5 (stretch) |
| Guided V1 | Primary | Desk + shelf; no warehouse |
| Self V1 | Primary | Browse tray start in fold |
| Hub fold | Enter paths | One composition |
| Mode flip | Behavior | Re-stage, not stack |
| Aesthetics | Tokens / grain / desk / map craft | Unchanged intent |

---

## 8. Out of scope

- Product code in the agent that authored this plan.
- Facelift Fraunces swap (G2 absorb — design-only until Worlds merge).
- Sound / critics / labs.
- Re-opening B1–B7 unless ship gates fail.
- Git operations.

---

## 9. Next action

1. Author/confirm sibling [`2026-08-06-worlds-game-hud-composition-brief.md`](./2026-08-06-worlds-game-hud-composition-brief.md) (HUD regions; still missing in worktree as of this edit).  
2. Daniel confirms Wave 0 soft defaults (Q2–Q7) or overrides.  
3. Implement **Wave 1 → 2** in worktree (tray + Mode-split B stages); verify against scoreboard — composition must read as game-HUD panels, not shorter marketing scroll.  
4. Wave 3 hub packing; then 4–6.  
5. Update guided-mode + genre IA + hub IA docs to point at this stage diagram + game-HUD brief (replace “unchanged Guided mount”).

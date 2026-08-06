# Worlds UX Roast — Interaction · Cognitive Load · Guided

**Agent:** Roast 3/4  
**Date:** 2026-08-06  
**Target:** `http://localhost:5173` (worktree `immersive-curated-genre-specific-experie`)  
**Lens:** Interaction design, cognitive load, Guided UX staging  
**Method:** Live reproduce (Documentary Guided complete dials + Companion open + decade scrub; hub Atlas/mood/map; Film-Noir empty Guided TV). No code. No git. Aesthetics stay; packing changes.

**Design read:** Projection-booth curator session that should stage one job at a time — not a simultaneous Self cockpit + Guided desk + Companion oracle + timeline warehouse.

---

## Verdict

Guided’s tour desk is the best interaction object on Worlds. Everything around it refuses to get out of the way. After three dials, the page still dumps Self steer, a 32-title rail, Featured ~3.5 viewports down, modules, neighbors, Map, Export, and an in-world Companion that can contradict the dials you just set. **Guided does not guide the session — it adds a panel onto an already-loud Self world.**

| Area | Load | Note |
|------|------|------|
| Tour desk (dials → shelf) | Low–moderate | Clear primary when isolated |
| Guided + full page chrome | Critical | Dual cockpits |
| Outcomes (Featured / thesis) | Critical | Scroll archaeology |
| Era systems (dial vs scrub vs shelf) | Critical | Three clocks, one user |
| Companion vs shelf | High | Second recommender |
| Hub entry (Atlas + mood + map) | High | Wall of equal doors |
| Empty + Guided simultaneous | High | Seed vs dial vs preview shelf |

**Cognitive load checklist (8):** fail **7/8** → critical.

Fails: single focus, chunking, visual hierarchy, one thing at a time, minimal choices, working memory (dial answers vs scrub vs Companion), progressive disclosure.  
Pass (partial): grouping inside the tour desk itself.

---

## Reproduction paths (not guesses)

### Path A — Documentary Guided, dials complete

1. `/genre/documentary?mode=guided` with session already `3/3` (“Tonight’s dossier is set”).
2. First viewport: hero + tour desk + Tonight shelf (3 picks × Watchlist/Pass) + Companion FAB.
3. Immediately below: Whisper (“Guided rail · every era · …”), library anchors, then **full Self steer** — Search, Sort, Self/Guided, Movies/TV, 9 tag chips, Surprise, Less well-known (~17 steer controls).
4. Timeline: 10 decade tabs + 32 title links. Featured (“Tonight’s lead”) measured ~3200–3600px from top on a ~945px viewport (~4.5 pages of scroll). Pumping Iron appears on shelf **and** Featured — duplicate outcome, delayed.

**Counts (live):** ~112 interactive elements on the world page; ~21 above the fold; tour ~14 buttons; steer strip ~17 controls; timeline 10 tabs.

### Path B — Companion open on complete Guided

1. FAB → “Reading Room Companion · IN-WORLD”.
2. Prefill correctly carries dials (`Sharp cut` / `Classic` / `Fringe dossier`).
3. Prior reply recommended **Selena Gomez: My Mind & Me (2022)** as “on tonight’s shelf” while the desk shelf was Classic-era (**Pumping Iron / F for Fake / Stop Making Sense**). Two oracles, one session.

### Path C — Timeline scrub vs Era dial

1. Dial Era = **Classic**; whisper initially “every era” (era beat clears decade scrub by design).
2. Click Timeline **1970s** → URL `?decade=1970s&mode=guided`; rail shrinks to 4 titles; whisper becomes “1970s”.
3. Tonight shelf **still** shows **Stop Making Sense (1984)** — scrub filters the page rail, not the Guided shelf. User now holds: Classic dial + 1970s scrub + mixed shelf years.

### Path D — Hub entry overload

1. `/genre`: Atlas cards + **~36 mood chips** + Archive list + Map (hover → Enter + warps).
2. Same world enterable four ways with equal weight. Map nodes are clickable (good) but primary Enter lives in a hover/focus detail panel — weak affordance until focus lands.

### Path E — Film-Noir empty + Guided + TV residue

1. `/genre/film-noir?mode=guided&mediaType=tv` (mediaType sticky from prior session).
2. Simultaneous: Tour desk 0/3 + Preview shelf of three titles + Empty “threshold not yet crossed” + seed Add CTAs.
3. Niche branch **hides** Self/Guided and Movies/TV steer (only present in the non-niche branch). User can be stuck in Guided TV empty without the mode/media toggles in view.

---

## What’s working (keep)

1. **Tour desk as a session object** — needle, live region, Retake, re-dial ticks, Tonight shelf actions. Feels like a curator, not a SaaS wizard.
2. **Metaphor-flavored beat copy** — Documentary vs Horror/Noir door language teaches without a tutorial modal.
3. **Whisper coupling intent** — “dials reshape order below” is the right contract; the page just violates it by offering three reshape tools at once.
4. **Companion prefill** — tour-aware text is the right germane load; the conflict is downstream recommendation vs shelf.

---

## Priority roasts

### P0 — Guided desk and Self page fight for the same job

**What:** After Guided mounts, the Self filter cockpit still renders at full weight (search/sort/mode/media/tags/presets) plus Timeline/Featured/modules. Mode toggle sits *below* the tour that already declared Guided.

**Why it matters:** Working memory can’t hold “I answered three dials” and “I might also Surprise / tag Music / sort Newest.” Primary task (pick tonight) loses to cockpit browsing.

**Fix (staging, not restyle):** In Guided **Dial** and **Claim** stages, demote or park Self steer. Mode/media become session chrome on the desk (or a single overflow), not a second toolbar. Self chrome returns in **Browse** stage only.

### P0 — Outcomes require scroll archaeology

**What:** Tonight shelf is above the fold; Featured thesis — the richest “why watch” — sits ~3–4 viewports down after a wall of posters. Caption even admits “same ranking as the guided shelf.”

**Why it matters:** Peak-end rule breaks: peak is the dial click; end is scrolling past 32 posters to rediscover the same title with an argument.

**Fix:** In Guided Claim stage, **Featured = expansion of shelf lead** (inline under shelf or replacing the long rail). Timeline becomes optional “widen the room,” not the mandatory middle of the page.

### P0 — Three era controls, one mind

**What:** (1) Era dial (Classic/Turn/Now) ranks shelf; (2) Timeline decade scrub filters rail + URL; (3) Whisper can say “every era” after Classic. Shelf years can disagree with scrubbed rail.

**Why it matters:** Extraneous load. User cannot form a stable model of “what era am I in?”

**Fix:** One era authority per stage. Dial owns era during Guided Dial/Claim; scrub is disabled or becomes a soft “peek” that doesn’t fork shelf. Or: scrubbing a decade is an explicit **re-dial Era** with confirmation. Never silent dual state.

### P1 — Companion is a second curator

**What:** Desk says claim shelf / re-dial / deepen. Companion can pitch a different title than the shelf and still claim shelf membership.

**Why it matters:** Guided should reduce choice; open Companion multiplies recommenders.

**Fix:** Stage **Deepen** only after Claim (or after 1 shelf act). When open during Claim, Companion should **narrate/defend the shelf three**, not invent a fourth. Prefill stays; free-roam suggest is Browse-stage behavior.

### P1 — Equal-weight control soup

**What:** First Guided decision point after complete dials offers: Retake, 3 re-dials, Deepen, 3×(Open/Watchlist/Pass), Companion FAB, then 17 steer controls, then 10 decade tabs…

**Why it matters:** ≫4 options (Cowan). Everything looks equally actionable.

**Fix:** Stage packing below. One primary CTA cluster per stage; park the rest behind “Tune” / “Widen” / “Export.”

### P1 — Empty world + Guided = two onboarding scripts

**What:** Film-Noir Guided shows dial sheet *and* empty seed strip *and* preview shelf. Niche layout removes Movies/TV + Self/Guided from the page.

**Why it matters:** Unclear whether success is “answer tempo” or “add Columbo.” Sticky `mediaType=tv` without visible toggle is a trap.

**Fix:** Empty worlds enter **Seed** stage first (no dial sheet until ≥1 anchor or explicit “tour unseeded”). Mode/media always available in session chrome. Guided Preview shelf waits until Seed clears or user opts into “tour cold.”

### P2 — Hub wall of doors

**What:** Atlas + ~36 mood chips + Archive + Map all offer enter with similar visual weight.

**Why it matters:** Before Guided even starts, choice overload.

**Fix:** One primary atlas; mood as filtered lens (collapsed); Map as optional territory view, not fourth equal nav. (Packing only — keep Instrument Ink look.)

### P2 — Map click affordance

**What:** Nodes navigate on click (code path solid); strongest “Enter {World}” CTA appears in the focus/hover detail strip. Territory fills feel decorative.

**Why it matters:** First-timers may hover without committing; power users click dots fine.

**Fix:** Always-visible Enter on focused node; cursor/affordance on nodes without requiring discovery of the side panel. Still no restyle of the map language — clarify the hit target contract.

---

## Heuristic scores (interaction-focused)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of system status | 2 | Whisper/dials good; era dual-state lies |
| 2 | Match system / real world | 3 | Curator metaphor lands |
| 3 | User control and freedom | 3 | Retake / re-dial strong |
| 4 | Consistency and standards | 1 | Mode toggle placement; niche hides media |
| 5 | Error prevention | 1 | Scrub vs dial fork; Companion vs shelf |
| 6 | Recognition rather than recall | 2 | Must remember dial intent while scrolling |
| 7 | Flexibility and efficiency | 2 | Power toys always on; no staged shortcuts |
| 8 | Aesthetic and minimalist design | 1 | Equal-weight chrome (interaction density) |
| 9 | Error recovery | 2 | Retake helps; dual-state recovery unclear |
| 10 | Help and documentation | 2 | Live cues good; no stage map |
| **Total** | | **19/40** | **Needs redesign of session packing** |

---

## Persona red flags

**Jordan (First-timer, “what should I watch tonight?”)**  
Completes dials → sees three shelf picks → also sees 32 posters and tag soup → opens Companion → gets a fourth title. Abandons without claiming. Empty Noir: dials + seed + preview = freezes.

**Alex (Power user, cinephile vault)**  
Wants Guided rank + Self scrub in one breath — fair — but today both are always-on with no “I’m done touring, unlock the cockpit” moment. Frustrated that Classic doesn’t pin the rail; invents workarounds (manual decade) that desync shelf.

**Sam (Returning, mid-session)**  
Resume whisper works; then Companion history + sticky TV mediaType on a new empty world. Feels haunted by last session’s media without a visible control.

---

## Proposed: session stage packing (keep aesthetics)

Packaging rule: **same Instrument Ink surfaces; different what’s allowed to speak.** One stage active; others present as collapsed cues, not full cockpits.

```
SEED → DIAL → CLAIM → DEEPEN → BROWSE
 (empty) (0–2) (3/3)  (opt)   (Self tools)
```

| Stage | On stage (primary) | Parked / demoted | Exit when |
|-------|--------------------|------------------|-----------|
| **SEED** | Empty metaphor CTA + ≤5 affinity adds; media toggle in thin session chrome | No dial sheet; no full timeline; Companion FAB optional whisper only | ≥1 library anchor **or** “Tour cold” |
| **DIAL** | Tour desk only: needle + one beat + preview shelf (actions muted or Watchlist-only) | Self steer, tags, Surprise, Featured body, Export, Map, modules | Beat answered → next beat; 3/3 → CLAIM |
| **CLAIM** | Shelf three as hero outcomes; Featured thesis **inline under lead**; Whisper confirms ranking | Timeline collapsed (“Widen eras”); steer in “Tune” disclosure; Companion CTA but panel defaults closed | Watchlist / Pass / Open **or** “Widen room” |
| **DEEPEN** | Companion opens with shelf-bound context; suggests among / adjacent to three | Free-roam catalog suggest; full Self presets | User closes Companion or “Browse freely” |
| **BROWSE** | Full Self chrome + Timeline + modules + Map + Export; Guided desk collapses to compact needle/status chip | Full dial sheet | Mode → Self, or Retake → DIAL |

### Staging vs simultaneous (explicit)

| Concern | Simultaneous today | Staged proposal |
|---------|--------------------|-----------------|
| Dials + Self tags/sort | Always | DIAL/CLAIM: dials win; BROWSE: Self wins |
| Shelf + Featured | Shelf early, Featured late duplicate | CLAIM: one composition |
| Era dial + decade scrub | Both live | DIAL/CLAIM: dial; BROWSE: scrub; or scrub = re-dial |
| Shelf + Companion free suggest | Both live | CLAIM: shelf; DEEPEN: Companion defends shelf |
| Empty seed + dials | Both live | SEED then DIAL |
| Hub Atlas + mood + map | All equal | Atlas primary; mood filter; map secondary |

### Delight (interaction-only, after packing)

- Stage transitions: needle fills → brief “dossier set” → shelf lifts (already close); don’t celebrate with confetti over 17 chips.
- Claim success: Watchlist pulse on the shelf card; Whisper one line; do **not** also spawn a competing Companion pitch.
- Browse unlock: compact chip “Tour complete · cockpit open” so power users feel the gear appear *because* they earned it — not because it never left.

### Clarify (copy contracts)

- Whisper after Classic must not say “every era” without qualifier (“ranked classic · rail still wide” or hide wide rail).
- Featured caption “same as shelf” is an admission of redundancy — kill the duplicate or co-locate.
- Empty: one line — “Seed this threshold, then we’ll dial tonight” — not two competing H2 regions.

---

## Suggested command order (when implementing later)

1. `/onboard` — SEED vs DIAL gate on empty/niche  
2. `/distill` + `/quieter` — CLAIM packing; demote Self steer in Guided Dial/Claim  
3. `/clarify` — era/whisper/shelf contracts; Companion shelf-bound copy  
4. `/arrange` — Featured co-located with shelf; Timeline as Widen  
5. `/delight` — stage unlock moments only  
6. `/polish` — after packing verified

---

## Success criteria (verifiable, no code yet)

1. In Guided Dial, countable primary decisions ≤4 (beat choices only).  
2. In Guided Claim, Featured thesis visible without scrolling past the full rail.  
3. Era dial and decade scrub never disagree silently (one authority or explicit re-dial).  
4. Companion open during Claim does not introduce a title outside the shelf three without labeling it “beyond tonight.”  
5. Empty world never shows full dial sheet + seed strip as equal primaries.  
6. Movies/TV + Self/Guided remain reachable on niche/empty via session chrome.  
7. Hub: one primary enter path above the fold; mood/map secondary.

---

## Out of scope for this roast

Visual restyle, token swaps, facelift fonts, implementation patches, git. Sister roasts own visual hierarchy / a11y / perf as needed; this doc owns **when** surfaces speak and **how many** speak at once.

# Worlds UX Roast — Grill-with-Docs · “Pack the long scroll”

**Agent:** Grill / Roast (docs-adversarial)  
**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Live:** `http://localhost:5173/genre` + `/genre/horror` (Self + Guided)  
**Docs grilled:** hub IA · genre IA · map redesign · guided-mode plan · root `.impeccable.md`  
**Sibling roast:** [`2026-08-06-worlds-ux-roast-interaction.md`](./2026-08-06-worlds-ux-roast-interaction.md) (cognitive load / staging). This file attacks **plan coherence** and **whether redesigns actually packed length**.  
**Method:** No code. No git. Explore docs + live DOM metrics. Ask Daniel the hard cuts.

---

## Idea verdict (grill Phase A)

**CHALLENGE — do not ship “IA done” as packing done.**

The redesigns fixed *wrong jobs* and *redundant title projection*. They did **not** define a single first-viewport job for the genre page, nor a packing law for Guided + Map. Live scroll still reads as stacked features, not staged sessions.

| Surface | Live scroll (≈900px viewport) | Plan claim |
|---------|-------------------------------|------------|
| Hub `/genre` | **~3.3 viewports** (3124px) | Hero + Atlas start in V1 — **partial pass**; Mood+Archive+Map still a second novel |
| Genre Self `/genre/horror` | **~4.4 viewports** (3913px) | “Hero + steer + timeline start” — **barely**; posters kiss the fold |
| Genre Guided `?mode=guided` | **~5.1 viewports** (4567px) | Genre IA said Guided “unchanged mount under hero” — **explicitly lengthens V1**; timeline **below fold** |
| Map `<details>` open | **+~940px** atlas SVG | Genre IA: “MAP + EXPORT — leave with something”; hub already owns Map |

**Bottom line:** Hub IA mostly landed its first job. Genre IA cut carousel/Nathan spam but left a warehouse. Guided plan added a rich desk **on top of** that warehouse. Map plan fixed “is it a map?” while **doubling** orientation surfaces. Nobody owned “what gets cut so the scroll fits a cinephile session.”

---

## Live stack (Horror, measured)

### Self — block tops (px from page top)

| Block | Top | Height | In first viewport? |
|-------|-----|--------|--------------------|
| ExperienceHero | 56 | 218 | Yes |
| WhisperStrip | 306 | 16 | Yes |
| **Closest in your library** (AnchorFrame) | 354 | 136 | Yes — **not in genre IA target** |
| Steer + facets | 522 | 129 | Yes |
| Timeline modules start | 683 | ~2882 | Header yes; body is the scroll |
| Featured thesis | ~2915 | — | No (~3.2 V down) |
| Neighbors | ~3597 | 93 | No |
| Map (collapsed) | ~3722 | 46 | No |
| Export | ~3800 | 41 | No |

### Guided — same page, mode on

| Block | Top | Height | In first viewport? |
|-------|-----|--------|--------------------|
| ExperienceHero | 56 | 218 | Yes |
| **GuidedTour desk** | 306 | **604** | Owns V1 |
| Whisper | 942 | 16 | **No** |
| AnchorFrame | 990 | 136 | No |
| Steer | 1158 | 129 | No |
| Timeline | 1319 | ~2900 | No |
| Featured | ~3551 | — | No (~4 V down) |

**First viewport under Guided:** hero + tour dials + Tonight shelf. Timeline, steer, whisper, Featured — all demoted by physics, not by IA.

---

## Hard contradictions in the plans

### 1. Three different “ONE jobs” for genre V1

| Source | Implied first-viewport job |
|--------|----------------------------|
| Genre IA redesign | Name the world → **browse by era** (timeline start) |
| Guided-mode plan | Name the world → **answer dials / claim tonight** |
| `.impeccable.md` | **One cinematic Tonight pull** above the fold; personal before popular |

These are not the same product. Genre IA success #4 (“hero + steer + timeline start”) **fails under Guided** by construction — and Guided is ship-criteria (G1). The plans never reconciled this.

**Genre IA literally says:** “Guided mode: GuidedTour sits under hero (unchanged mount). Sibling owns tour polish.”  
That is a **non-decision** dressed as scope hygiene. Unchanged mount = +600px before browse. Packing was deferred to “someone else.”

### 2. Map lives twice; NeighborRail makes three orientation systems

| Surface | Orientation affordance |
|---------|------------------------|
| Hub | WorldsMap closing section (plan: leave with atlas) |
| Genre page | NeighborRail (warps) + WorldsMap in `<details>` |
| Hub Atlas cards | Status + Enter |

Hub plan: Map closes hub. Genre IA: Map + Export close world. Map redesign: same component on hub **and** in-genre. Guided plan: Neighbor hop preserves mode. **Nobody said which one is canonical when you’re already inside a world.** Live: neighbors always visible; map collapsed but expands into nearly another viewport of SVG.

### 3. Hub “demoted Mood” still ships a thesaurus

Hub IA P0: mood must not own V1 — **fixed** (Atlas first; live screenshot confirms).  
Hub IA also kept “By mood — secondary, compact.” Live: **~36 alphabetized chips** still after Atlas — same thesaurus, later in the scroll. Archive pills after that. Map after that. **Job order fixed; length not packed.**

Status legend appears in **hero and Map** (Filled/Sparse/Empty counts twice). Atlas cards already carry status. Three statements of the same shelf heat.

### 4. “Cut redundant title projection” vs Guided shelf + Featured

Genre IA P0: one primary surface (timeline) + one deep dive (featured); cut bottom carousel. **Carousel gone — good.**  
Guided plan: Tonight shelf of 3 + Featured that “follows guided shelf lead.” Live caption: “Tonight’s lead — same ranking as the guided shelf.” So the **Nathan problem returned as vertical distance**: same title twice, thesis buried under the rail the redesign made primary.

### 5. Density dials vs impeccable anti-pill

Plans set DENSITY 5–6 (product hub / atlas). Impeccable anti-references: **pill soup**. Live genre steer still dumps tagged chips + Surprise + Less well-known in row 2; hub still mood-pill cloud. Density was used as permission to keep chips, not as a budget.

### 6. Worlds chrome vs facelift type stack

Guided plan: Worlds = Cabinet/Geist Instrument Ink until merge; Facelift Fraunces/Public Sans = design-only until Gate W. Root `.impeccable.md` already mandates Fraunces + Public Sans. **Two brand IAs for one product** — not a scroll issue, but it means “pack aesthetics later” keeps delaying the cut decisions that would make length feel intentional.

### 7. Sibling out-of-scope walls prevented packing ownership

| Plan | Explicitly out of scope |
|------|-------------------------|
| Hub IA | GenreExperience / Guided / Companion |
| Genre IA | GuidedTour polish; empty polish; server ranking |
| Map redesign | GenreExperience IA / Guided / NeighborRail |
| Guided plan | Owns tour — mounts **into** full Self page without rewrite |

Each agent could claim success without answering: **what is the genre page allowed to show at once?** That is the packing failure mode.

---

## Glossary fights (grill-with-docs)

Vague language that plans use as if shared:

| Fuzzy term in plans | Competing meanings live | Proposed canonical (needs Daniel) |
|---------------------|-------------------------|-----------------------------------|
| **Map** | Hub territory SVG · genre `<details>` · old Chart · NeighborRail “warps” | **Territory atlas** = hub-only orientation; in-world = **Neighbor warps** only |
| **Tonight** | Guided shelf · Featured “Tonight’s lead” · Discover “tonight pull” | **Tonight shelf** = Guided claim surface; Featured = expansion of lead, not a second shelf |
| **Steer** | Search/sort/mode/media · era dial · decade scrub · tags/presets | Split: **Session chrome** (mode/media) vs **Browse steer** (search/sort/tags) vs **Tour dials** |
| **Primary** | Timeline (genre IA) · Tour desk (guided) · Atlas doors (hub) | Per-mode primary — see packing architecture |
| **Compact** (mood) | Still ~36 chips | Cap or group; “compact” without a budget is a lie |

No `CONTEXT.md` updated — terms not resolved until Daniel answers below.

---

## What the redesigns actually solved

**Solved (credit where due):**

1. Hub first job: enter a world (Atlas + status), not mood-first.  
2. Alias Sci-Fi duplicate door gone from Atlas.  
3. Genre: For You carousel removed; topics → “Also tagged”; Featured ×1.  
4. Timeline All-eras / poster rail direction correct.  
5. Guided is real (session, ranking ≠ Self) — not fiction.  
6. Map medium fixed (territory SVG recognizable as map after Chart failure).

**Not solved (the brief):**

1. Genre page still **4–5 viewports** of simultaneous cockpit.  
2. Guided **adds** height; does not replace Self browse.  
3. Featured / thesis still scroll archaeology.  
4. Mood/Archive length on hub untouched.  
5. Map + Neighbors + Atlas status = orientation spam.  
6. AnchorFrame still occupies V1 against genre IA composition.  
7. No packing ADR / no “one job per stage” law across siblings.

---

## Recommended packing architecture

**Law:** One primary surface per **stage**. Everything else is parked (panel, tab, details, or route), not stacked.

### Stages (genre page)

```
┌─ ENTER ─────────────────────────────────────────────┐
│ Hero names the world (metaphor + origin).            │
│ Session chrome: Self | Guided · Movies | TV          │
└──────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
 Self         Guided
    │           │
┌───▼───┐   ┌───▼──────────────────────────────┐
│ BROWSE│   │ DIAL → CLAIM                     │
│       │   │ Tour desk + Tonight shelf = V1   │
│ Whisper│   │ Featured thesis expands lead     │
│ Steer │   │ (inline / drawer — NOT under rail)│
│ Timeline│  │ Timeline = “Widen” panel/tab     │
│ Featured│  │ Self steer parked until Browse   │
│ (modules│  │                                 │
│  secondary)│ └────────────────────────────────┘
└───┬───┘              │
    └────────┬─────────┘
             ▼
┌─ LEAVE ─────────────────────────────────────────────┐
│ Neighbor warps (always compact)                      │
│ Export (action)                                      │
│ Map: DO NOT remount full atlas — link to hub #map    │
└──────────────────────────────────────────────────────┘
```

### What gets cut / demoted

| Thing | Cut / park | Why |
|-------|------------|-----|
| Full Self steer under Guided Dial/Claim | Park behind “Tune browse” or Browse stage | Dual cockpit |
| Timeline wall under Guided Claim | Optional Widen | Tonight already claimed |
| Featured duplicate of shelf lead | Collapse into shelf expansion | Nathan problem v2 |
| WorldsMap full SVG on genre page | Link-out or tiny warp-only | Hub owns atlas |
| AnchorFrame in V1 | Collapse into whisper Evidence / below Featured | Not in IA target; steals browse |
| Hub mood 36 chips | Cap, group by metaphor, or drawer “Browse by mood” | Demoted in order, not in length |
| Duplicate status totals (hero + map) | One legend | Same heat thrice |
| Marathon / Geo / Maker | Module tabs or below Featured only when module on | Secondary axes already “if module” |

### Where Guided and Map live without doubling length

| Mode | Guided | Map |
|------|--------|-----|
| **Self** | Toggle only (no desk) | Hub atlas; genre = Neighbors + optional “Open atlas” link |
| **Guided Dial/Claim** | Desk owns V1; shelf = tonight | No map chrome |
| **Guided Browse** (after claim, user widens) | Desk collapses to needle strip | Still no full SVG; Neighbors enough |
| **Hub** | N/A | **Canonical Map** (territory + coverage + warps) |

### Hub packing (secondary but real)

V1 stays: Worlds hero + Atlas start.  
Below: Atlas continues (consider filled-first + “Show empty” disclosure).  
Mood: disclosure, not always-on thesaurus.  
Archive: disclosure.  
Map: keep as closing gesture — one orientation beat, then leave.

### Success criteria (replace the soft ones)

1. Guided V1: hero + desk + shelf (± collapsed needle). Timeline **not** required in V1.  
2. Self V1: hero + whisper + steer + **poster start** (not just “Timeline” heading). AnchorFrame does not push posters out.  
3. Featured thesis reachable within **1 scroll** of its source title (shelf lead or selected poster) — no 3-viewport gap.  
4. In-genre page never mounts a second full WorldsMap; hub `#map` is the atlas.  
5. Hub mood/archive either collapsed by default or ≤1 viewport combined after Atlas.  
6. One status legend per surface.

---

## Unanswered questions for Daniel

*Grill protocol: answer one at a time. Most critical first. Recommended answers in italics.*

### Q1 — THE cut (answer this first)

**What is the ONE job of the genre page first viewport — Browse (timeline) or Claim tonight (Guided desk / shelf)?**

- A) **Browse-first always** — Guided desk collapses or docks; timeline stays V1.  
- B) **Mode-split** — Self = Browse V1; Guided = Claim V1; Browse is a later stage. *(Recommended.)*  
- C) **Tonight-first always** — even Self shows a 3-pull; timeline secondary.  

*Without Q1, every “pack the scroll” PR is guesswork.*

### Q2 — Map ownership

**Is the territory Map a hub-only closing atlas, or must every genre page carry it?**

- A) Hub-only + Neighbors in-world. *(Recommended.)*  
- B) Keep collapsed `<details>` Map on genre.  
- C) Replace Neighbors with Map.

### Q3 — Featured vs Tonight shelf

**When Guided shelf and Featured show the same lead, is Featured allowed to exist as a separate scroll section?**

- A) No — Featured is expansion of shelf lead only. *(Recommended.)*  
- B) Yes — timeline primary, Featured stays below rail.  
- C) Kill Featured in Guided entirely.

### Q4 — AnchorFrame

**Does “Closest in your library” belong above the fold on a filled world?**

- A) No — evidence in whisper or under Featured. *(Recommended; matches genre IA omission.)*  
- B) Yes — keep as trust signal.  
- C) Only when niche/empty.

### Q5 — Hub mood length

**After Atlas, is a 36-chip mood wall still acceptable as “secondary compact”?**

- A) No — drawer / grouped / capped. *(Recommended.)*  
- B) Yes — order fixed is enough.  
- C) Kill mood; Atlas + Map only.

### Q6 — Guided Browse stage

**After dials complete, should the full Self cockpit + timeline appear automatically, or only when the user chooses “Widen the room”?**

- A) Only on Widen. *(Recommended packing.)*  
- B) Always show full Self page under desk (today).  
- C) Replace timeline with shelf-only until Retake/Self.

### Q7 — Density budget

**Pick a hard budget: max viewports for a “done” Self world page (neighbors+export, map linked out).**

- A) ≤2.5  
- B) ≤3.5 *(Recommended stretch goal from live 4.4.)*  
- C) No budget — polish density instead of cut.

---

## Scenarios that break the current plans

1. **Guided complete + want thesis:** User answers 3 dials, sees shelf, wants “why this title” → must scroll past entire poster warehouse. Genre IA said Featured is the deep dive; Guided put the dive after the primary browse it also demanded.  
2. **Guided + decade scrub:** Dial era ranks shelf; scrub filters rail; whisper can disagree — three clocks (see interaction roast). Plans never declared a single era authority.  
3. **Hub “I’m oriented”:** User reads Atlas status, scrolls through mood+archive, then Map repeats status + warps. Orientation job done three times; enter job done once.  
4. **Empty + Guided:** Niche branch hides steer (interaction roast Path E) while desk still runs — packing and empty-state plans never met.  
5. **Ship gate conflict:** Guided G1 “tour desk visible” + Genre IA “timeline in V1” cannot both be true without a stage model.

---

## Best Available Consensus (until Daniel answers Q1)

**Proposal:** Treat packing as a **mode-stage architecture**, not another section redesign.

### Resolved (from docs + live — safe to treat as true)

- Hub primary job is Enter (Atlas); mood-first was wrong.  
- Genre must not restate one title four ways; carousel cut was correct.  
- Guided must change behavior; desk is the right object.  
- Map must look like a map; Chart was a label lie.  
- Live length proves stacking ≠ packing.

### Unresolved objections

1. **V1 job ambiguity** — Risk: HIGH — Mitigation: Daniel answers Q1.  
2. **Map double-mount** — Risk: MEDIUM — Mitigation: default hub-only pending Q2.  
3. **Featured archaeology** — Risk: HIGH — Mitigation: default Q3-A until overridden.  
4. **Mood wall length** — Risk: LOW–MEDIUM — Hub V1 already OK; polish after genre packing.

### Don’s decision required

Accept mode-split packing (Q1-B + Q2-A + Q3-A + Q6-A), reject and redefine the idea, or table until after merge.

---

## Grilling Conclusions (for next Sit-Down / plan)

| Field | Value |
|-------|--------|
| **Idea Verdict** | CHALLENGE |
| **Key decision pending** | Mode-split V1 job (Browse vs Claim) |
| **Rejected alternative** | “Unchanged Guided mount under full Self page” as packing strategy — it is additive length |
| **Rejected alternative** | Another visual polish pass on Timeline/Map without cuts |
| **Termination** | Best Available Consensus — Q1–Q7 unanswered |
| **Next action** | Daniel answers Q1; then write a short packing ADR / update genre+guided plans to one stage diagram |

---

## Sources

- `docs/plans/2026-08-05-worlds-hub-ia-redesign.md`  
- `docs/plans/2026-08-05-genre-experience-ia-redesign.md`  
- `docs/plans/2026-08-05-worlds-map-redesign.md`  
- `docs/plans/2026-08-05-worlds-guided-mode-plan.md`  
- `C:\Users\Danie\Documents\Claude\Projects\Lumina\.impeccable.md`  
- Live DOM metrics 2026-08-06 on `/genre`, `/genre/horror`, `/genre/horror?mode=guided`  
- Sibling: `docs/plans/2026-08-06-worlds-ux-roast-interaction.md`

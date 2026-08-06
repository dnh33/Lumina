# Worlds v2 — 5-Axis Review (POST Mode-split packing)

> **Status:** REVIEW COMPLETE · home-stretch SoT for fix dispatch  
> **Date:** 2026-08-06  
> **Author:** Rune (frontend-ultimate / deep QA)  
> **Worktree:** `immersive-curated-genre-specific-experie`  
> **Live:** `http://localhost:5173` (server restarted; isolated session `worlds-5axis-qa`)  
> **Method:** Browser evidence only (agent-browser). Scores earned, not aspirational. No git.  
> **P0 crashes fixed this pass:** **none** (none found). Parent dispatches fixers from §4–5.  
> **Prior SoT:** packing scoreboard `2026-08-06-worlds-packing-status-board.md` · a11y `2026-08-06-worlds-packing-a11y-notes.md` · historical grill `2026-07-15-worlds-v2-5axis-review.md`

---

## 0. Verdict in one breath

Mode-split B packing **holds**. Density targets still green at 1440×900. Guided dials / Widen↔Claim / map Enter / Companion stream all **work**. No crash blockers. Remaining debt is **soft**: hub Empty≠empty-world semantics, dial UX (open→pick radio), dual Deepen, optional a11y P1, Wave 6 taste.

**Overall: ship-ready for Daniel live QA — not “perfect.”** Do not reopen packing waves without a new priority.

---

## 1. Five-Axis Verdict Table

| # | Axis | Score | Summary |
|---|------|------:|---------|
| 1 | **Composition / IA** | **4** | Map owns hub fold; doors/mood disclosed; Self tray + Guided claim cockpits pack. Below-fold modules (Featured/Argument/Export) still exist — intentional warehouse after stage, not a packing miss. |
| 2 | **Interaction / Guided** | **4** | Mode flip, dials (radio pick), Widen↔Claim desk, Companion DEEPEN stream verified. Soft: dual Deepen CTAs; dial does not cycle on first click alone. |
| 3 | **Catalog quality / eras** | **3** | Horror/Doc decade density strong; cold bootstrap to preferred decade works. Hub **Empty/Unseeded** for Film-noir while Self paints a full 1950s tray — status semantics lie about “is there a world?” |
| 4 | **Craft / aesthetics** | **4** | Booth chrome, world accents (Horror red / Noir purple), atlas territories readable. Not SaaS-slop. Soft: chrome stacking + tag chip wall still eat Self fold. |
| 5 | **Reliability / a11y** | **4** | Zero crashes/console traps in pass. Map keyboard Enter→Horror. Mode announce live. Companion streams coherent text. A11y P1 still open (roving radios, long tab paths). |

**Mean ≈ 3.8.** Anti-slop: nothing scores 5 — map/hub job collision residue, Empty-status fiction, and a11y P1 keep the ceiling honest.

---

## 2. Re-measured vh (evidence)

**Viewport lock:** `1440 × 900` (`innerWidth`/`innerHeight` confirmed).  
**Formula:** `scrollHeight / innerHeight` on `documentElement`/`body` max.  
**Note:** Packing scoreboard used ~945px height → slightly **lower** ratios. This pass is the comparable re-measure; both still meet targets.

| Surface | URL / state | Live vh | Target | vs scoreboard | Verdict |
|---------|-------------|---------|--------|---------------|---------|
| **Hub** | `/genre` | **1.289** | ≤1.5 | was 1.23 | **PASS** |
| **Horror Self** | preferred decade `2020s` | **2.166** | ≤3.5 | was 2.13 | **PASS** |
| **Horror Self** | All eras overview | **1.932** | — | — | Shorter than decade tray (overview wins) |
| **Horror Guided Claim** | `?mode=guided` claim | **1.506** | ≤2.0 | was 1.43 | **PASS** |
| **Horror Guided Widen** | after Widen CTA | **1.347** | — | — | Tray unlocked; Claim desk return present |
| **Doc Self** | `2020s` | **2.092** | ≤3.5 | — | **PASS** |
| **Doc Guided Claim** | claim | **1.478** | ≤2.0 | was 1.48 | **PASS** |
| **Noir Self** | preferred `1950s` | **2.197** | ≤3.5 | — | **PASS** |
| **Noir Guided** | dial stage (sparse) | **1.018** | ≤2.0 | — | **PASS** |

Screenshots (worktree `docs/plans/`): `qa-hub.png`, `qa-horror-guided.png`, `qa-horror-self.png`, `qa-doc-self.png`, `qa-noir-self.png`, `qa-companion.png`.

---

## 3. Per-axis findings (browser evidence)

### Axis 1 — Composition / IA · **4/5**

**<CODE_REVIEW>**
Mode-split B is visible in the DOM: sticky Self|Guided · Movies|TV; Guided claim parks Timeline until Widen; hub map region `Worlds territory map` owns the fold with Door list / By mood as `<details>`. Self cold-loads preferred decade (`horror?decade=2020s`, `film-noir?decade=1950s`). Leave-path / Open vault atlas present in Self.
**</CODE_REVIEW>**

| Finding | Severity | Evidence |
|---------|----------|----------|
| Hub one-fold: map + focus strip + Enter Horror | Soft residual | Hub vh 1.289; disclosures only for Door list / By mood |
| Mode-split stage swap Self↔Guided | Pass | Live announces: “Self mode. Browse tray…” ↔ “Guided mode. Claim cockpit…” |
| Guided claim still scrolls to Featured/Argument/Maker | Soft | Claim vh 1.506 — fold is shelf; modules below are post-stage |
| Archive leftovers still under hub disclosures | Soft | Hub snapshot: Action…War pill links after map |
| Atlas + Door list + Mood = three entry metaphors | Soft (known roast) | Product job collision demoted, not deleted |

### Axis 2 — Interaction / Guided · **4/5**

| Finding | Severity | Evidence |
|---------|----------|----------|
| Widen → browse tray; Claim desk returns | Pass | After Widen: `guided=true`, live “Guided widen · browse tray unlocked”, button **Claim desk**; back → dials + Tonight shelf |
| Mode flip Guided→Self | Pass | URL drops to `?decade=2020s`; Self pressed; tray restores |
| Dials present on claim; radios on unanswered stage | Pass | Horror claim: Tempo/Era/Risk buttons; Noir dial stage: `role=radio` Creeping/Tight coil/Breach |
| Era dial click alone does not change value | Soft | Click Era → radios appear (`Classic` / `Turn of century` / `Now`); label stayed Classic until radio pick — **expected UX if documented; easy to miss** |
| Dual Deepen | Soft | FAB “Deepen with the horror companion” + desk **Deepen** both open companion |
| Companion DEEPEN stream | Pass | `data-companion-mode="guided-deepen"`; “Lumina is writing” → recalled titles → multi-sentence reply; no `undefined`/`[object Object]` garbage |

### Axis 3 — Catalog quality / eras · **3/5**

| Finding | Severity | Evidence |
|---------|----------|----------|
| Horror decade density | Pass | Tabs 1960s–2020s with counts; tray “8 titles”; 2020s poster set loads |
| Cold bootstrap preferred decade | Pass | Map Enter → `horror?decade=2020s`; Doc → `2020s`; Noir → `1950s` |
| Hub Film-noir **Empty / Unseeded / 0 on shelf** vs rich Self tray | **P1 product** | Hub labels Empty; Self shows Big Heat, Vertigo, Elevator… in 1950s. Status = library anchors, not world emptiness — **misread risk** |
| Doc Sparse (3 on shelf) honest vs filled Horror | Pass | Hub Sparse matches thin library; world still curates |
| Whisper opacity | Soft | “Your every era leans open…” on All eras — poetic, low signal |
| Guided Classic shelf quality | Pass | Cremator / Baby Jane / Kwaidan — coherent Classic dread set |

### Axis 4 — Craft / aesthetics · **4/5**

| Finding | Severity | Evidence |
|---------|----------|----------|
| Booth chrome + world accent | Pass | Horror Guided red dials/mode; Noir Self purple Self pill; hub gold Enter |
| Map readability | Pass | Six territories, kinship edges, Filled/Sparse/Empty legend, focus strip |
| Self tag chip wall | Soft | Action…+N more still above tray — eats vertical before Timeline |
| Ghost count numeral (40 / 27) | Soft craft | Atmospheric; can read as clutter next to title |
| Not AI-slop palette | Pass | No purple-on-white SaaS; projection-booth hush holds |

### Axis 5 — Reliability / a11y · **4/5**

| Finding | Severity | Evidence |
|---------|----------|----------|
| No page crashes this pass | Pass | Hub → Horror/Doc/Noir Self+Guided; Widen; Companion send |
| Map keyboard Enter | Pass | Focus Horror node → Enter → `/genre/horror?decade=2020s` |
| Mode / whisper / decade live regions | Pass | Multiple `aria-live` strings observed on flips and tray |
| Guided dial radiogroup | Pass (P0 packing) | Noir unanswered stage exposes radios |
| A11y P1 still open | Soft | See packing a11y notes P1-1…P1-12 (roving radios, long tray tab path, NVDA not run) |
| Companion stream | Pass | End-to-end reply received; `garbage:false` |

---

## 4. Blockers vs soft

### Blockers (P0) — ship-stoppers

| ID | Item | Status |
|----|------|--------|
| — | **None found** | No crash, blank stage, or dead primary path in this pass |

### Soft / P1 — fix when prioritized (parent dispatch)

| ID | Priority | Item | Owner hint |
|----|----------|------|------------|
| **S1** | P1 | Hub **Empty/Unseeded** vs curated Self tray (Film-noir) — rename status or show “library empty · catalog live” | Hub / catalog copy · **FIXED 2026-08-06** — `worldShelfStatus.ts`: Dense/Thin/No shelf · catalog live; browser: Noir hub `No shelf, catalog live` ↔ Self 1950s tray (Big Heat, Vertigo…) |
| **S2** | P1 | Era/Tempo/Risk dial: first click opens radios — ensure visible affordance (“choose”) so retune isn’t a dead click | Guided cockpit |
| **S3** | P1 | Dual Deepen (FAB + desk) — demote one | Companion / Guided |
| **S4** | P1 | A11y P1-2 roving arrow keys inside dial `radiogroup` | Guided + a11y notes |
| **S5** | P1 | A11y P1-5 long tab path through tray posters | Self tray |
| **S6** | P2 | Whisper “leans open” opacity; ghost count weight | Craft / Wave 6 |
| **S7** | P2 | Self tag chip density above tray | Self steer |
| **S8** | P2 | Hub Archive pills still after map (disclosure OK; copy still leftover-feeling) | Hub IA |
| **S9** | P2 | Companion recall sometimes pulls off-genre titles mid-Horror deepen (Rehearsal) — RAG scope soft | Companion / RAG |
| **S10** | P2 | Mode-flip / Featured focus handoff (a11y P1-11) | Seam |

---

## 5. Recommended next fixes (prioritized for parent)

1. **S1 — Empty-status honesty** (highest user confusion) — Film-noir hub must not say “empty room” when Self has a full decade tray.  
2. **S2 — Dial retune affordance** — one visible step from “tap dial” → radio choices.  
3. **S3 — Single Deepen** — keep FAB or desk CTA, not both.  
4. **S4/S5 — A11y P1 shortlist** — roving radios + skip-tray (from packing a11y notes).  
5. **Wave 6 taste only if Daniel asks** — whisper, ghost numeral, tag density — **do not reopen packing**.

---

## 6. Surfaces exercised (checklist)

- [x] Hub `/genre` — vh, map, disclosures, status legend  
- [x] Map keyboard focus + Enter → Horror  
- [x] Horror Self + All eras + decade tray  
- [x] Horror Guided Claim + Widen + Claim desk return + dial open  
- [x] Horror Guided → Self mode flip  
- [x] Documentary Self + Guided Claim  
- [x] Film-noir Self + Guided dial stage  
- [x] Companion open + send + stream completion (`guided-deepen`)  
- [ ] NVDA / VoiceOver full pass — **not run** (still open)  
- [ ] Mobile 375px fold — **not run** this pass  

---

## 7. What packing already proved (do not thrash)

From live re-measure + status board: Hub ≤1.5, Self ≤3.5, Guided Claim ≤2.0 — **still true**. Ownership leash stands: no hub/Self-tray/Guided packing rewrites as “density” work. Fix S1–S5 surgically.

---

## 8. Stop

Deliverable complete. **No P0 code fixes applied** (none required). Parent may dispatch fixers from §5.

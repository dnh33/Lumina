# Worlds Packing — Surface Ownership

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Law:** Mode-split B + game-HUD brief. Craft bar maximal. No crude collapse.  
**Status sweep:** 2026-08-06 — **Wave packing COMPLETE · scoreboard GREEN** (docs only; no product code)  
**Canonical board:** `2026-08-06-worlds-packing-status-board.md` (keep this file in sync)

## Owners

| Surface | Owner | Files (deep structure) | Out of scope for others |
|---------|-------|------------------------|-------------------------|
| **Hub one-fold** | Hub sibling | `GenrePicker.tsx`, `WorldsMap.tsx` | Do not rewrite atlas/map/mood composition |
| **Self tray / browse** | Self sibling | `TimelineScrubber.tsx` (+ Self browse layout inside experience if claimed) | Do not rewrite tray/decade chrome deeply |
| **Guided cockpit** | Guided sibling | `GuidedTour.tsx`, `guidedCurator.ts`, `guidedStage.ts` | Do not rewrite dial/shelf desk |
| **Companion DEEPEN** | Companion nugget | `CompanionPanel.tsx` (+ light `tourCue` wiring on page) | Do not restyle Self companion novel dock |
| **Integration / seams** | Orchestrator (this agent) | `GenreExperience.tsx` page shell, `GenreModules` **stage prop wiring only**, shared session chrome, mode-flip, leave-path links, accent/control-row craft at seams | No hub/tray/tour deep rewrites |

## Status board

Canonical copy: **`2026-08-06-worlds-packing-status-board.md`**. Snapshot below.

### Scoreboard — GREEN

| Surface | Before | Live | Target |
|---------|--------|------|--------|
| **Hub** | ~3.3 vh | **1.23** | ≤1.5 |
| **Horror Self** | ~4.2 vh | **2.13** | ≤3.5 |
| **Horror Guided Claim** | ~4.9 vh | **1.43** | ≤2.0 |
| **Doc Guided** | — | **1.48** | ≤2.0 |

**Verdict:** Mode-split B packing wave **COMPLETE**.

### DONE

| Lane | Status | Evidence (one line) |
|------|--------|---------------------|
| **Wave packing (Mode-split B)** | **COMPLETE** | Scoreboard GREEN — Hub 1.23 · Horror Self 2.13 · Horror Guided Claim 1.43 · Doc Guided 1.48 |
| **Hub one-fold** | **DONE** | Map-as-atlas owns fold; **~3.3 → 1.23 vh**; Enter in fold (focus strip); doors/mood disclosures |
| **Self tray / browse** | **DONE** | Decade-first tray + All-eras summary; Horror Self **~4.2 → 2.13 vh**; pageLenJump≈0 on All eras |
| **Guided cockpit (packing)** | **DONE** | Claim desk V1 + Widen; Horror Guided Claim **~4.9 → 1.43**; Doc Guided **1.48** |
| **Integration / seams** | **DONE** | Mode-split shell, sticky Self\|Guided · Movies\|TV, `GenreModules` stage wiring, leave-path → hub `#map` |
| **Companion DEEPEN** | **DONE** | `data-companion-mode="guided-deepen"`; shorter pane; tour strip; loading/error/**success** `tourCue` (C5-stable) |
| **Tray `content-visibility`** | **DONE** | Decade `<li>` `[content-visibility:auto]` + `contain-intrinsic-size`; controlled test asserts classes |
| Wave 0 — decisions + briefs | **DONE** | Mode-split B + game-HUD brief + ownership leash + packing plan authored |
| Wave 1 — Self tray + decade-first | **DONE** | Same as Self tray lane above |
| Wave 1b — tray `content-visibility` | **DONE** | Same as tray CV lane above |
| Wave 2 — Mode-split shell | **DONE** | Same as Integration / seams above |
| Wave 3 — Hub one-fold | **DONE** | Same as Hub lane above |
| Wave 4 — Leave path (Q2-A) | **DONE** | In-genre: `NeighborRail` + `Link to="/genre#map"`; no remounted `WorldsMap` on experience page |
| Wave 5 — Companion DEEPEN HUD | **DONE** | Same as Companion DEEPEN above |
| A11y P0 packing | **DONE** | Mode announce + tray tab/region + Guided radios (a11y notes P0) |
| **Cold bootstrap** | **DONE** | Self `activeDecade` + `pickPreferredDecade` + `useLayoutEffect` URL commit; Horror/Documentary cold load lands preferred decade tray (not All eras) |
| Wave 5 — Whisper / era contracts | **DONE** | `guidedStage` + `eraBand` + `isSeedWorld={isNiche}`; live Classic-band whisper; success `tourCue` C5-stable |
| **Widen** | **DONE** | Desk CTA → `guidedWiden` chip + tray; page `<details>` removed; live verified |

### Remaining optional (not packing blockers)

| Lane | Status | Notes |
|------|--------|-------|
| **A11y P1** | **OPTIONAL** | P1-1…P1-12 open (roving radios, skip-tray, map HC/live region, Featured focus handoff, NVDA). Packing P0 done. |
| **Wave 6 — Density / taste polish** | **OPTIONAL** | `/typeset` / gold budget / Constellation retint. Scoreboard already green. |

Surgical craft leftovers (C3 title weight, C8 square crop, decade-peek UX, mode-flip motion) are **outside** Mode-split B packing — park or schedule separately.

## Gold nuggets

### Done

- [x] Ownership leash + mode-split packing plan + game-HUD composition brief
- [x] Self decade tray + All-eras summary (pageLenJump≈0 on All eras; tray ≤0.9vh target in code)
- [x] Tray poster `content-visibility` perf nugget
- [x] Mode-split B page shell (re-stage, not stack) + sticky Self|Guided · Movies|TV — **integration seams DONE**
- [x] Hub map-as-atlas one-fold — **~3.3 → 1.23 vh**; Enter in fold; doors/mood demoted
- [x] In-genre leave path → hub `#map` (Q2-A)
- [x] Guided Companion DEEPEN HUD (geometry + chrome + tour strip)
- [x] Packing a11y P0 (mode announce, whisper live, tray focus/tabs, dial radios)
- [x] Cold bootstrap — Self `activeDecade`/`pickPreferredDecade`; cold load + Guided→Self null scrub re-lands preferred tray
- [x] Wave 5 Whisper / era — `guidedStage` + `eraBand` + `isSeedWorld={isNiche}`; success Companion `tourCue`; Classic-band live
- [x] **Widen** — desk CTA → `guidedWiden` chip + tray; page `<details>` removed; live widen→tray→Claim desk
- [x] **Live packing scoreboard GREEN** — Hub 1.23 · Horror Self 2.13 · Horror Guided Claim 1.43 · Doc Guided 1.48
- [x] **Wave packing (Mode-split B) COMPLETE**

### Remaining optional

- [ ] **A11y P1** — P1-1…P1-12 (roving radios, skip-tray, map HC, Featured handoff, NVDA)
- [ ] **Wave 6 taste polish** — `/typeset` / gold budget / Constellation retint (only if prioritized)

### Proposed next (post-packing)

- [ ] Optional: A11y P1 slice (orchestrator: P1-9/P1-10/P1-11; siblings for tray/map/dial)
- [ ] Optional: Wave 6 taste polish (scoreboard already green — no density work)
- [ ] Ship path: live QA → PR → Worlds merge (facelift code still gated on merge)

## Integration responsibilities

1. **Mode flip re-stages** — Self mounts browse stack; Guided mounts claim stack; never stack both cockpits.
2. **Session chrome** — Self|Guided · Movies|TV always reachable (sticky control row).
3. **Stage prop** — Pass `GenreModules` `stage="full"|"claim"|"browse"`; do not re-implement module interiors.
4. **Decade-first bootstrap** — Call `pickPreferredDecade` from page (Self only); scrubber owns tray UI.
5. **Leave path** — Prefer link to hub `#map` over remounting full WorldsMap (Q2-A default).
6. **Craft at seams** — One world accent, control-row alignment, motion/reduced-motion, focus states.

## NEED / conflicts

| NEED | Why | Asked of | Thrash risk |
|------|-----|----------|-------------|
| Featured placement | `GenreModules stage="claim"` vs Tour `children` inspect | Orchestrator + Guided | **Medium** — don’t move Featured twice |
| Hub / tray / Guided packing deep polish | Packing lanes **DONE** + scoreboard GREEN | Hub / Self / Guided siblings | **High if reopened** — ownership forbids peer rewrites |
| A11y P1 map focus | Map SVG HC + live region | Hub sibling | Stay out of `WorldsMap` deep structure from orchestrator; **optional** |
| Wave 6 taste polish | Optional post-green | Craft / Daniel | No density thrash — polish only |

## Blocked / NEED log (active)

| NEED | Why blocked | Asked of |
|------|-------------|----------|
| _(none for packing)_ | Scoreboard GREEN; Wave packing COMPLETE | — |
| A11y P1 / Wave 6 | Optional backlog — not blockers | Daniel priority |

## Checklist (historical — keep in sync with status board)

- [x] `GenreModules` honors `stage` prop (seam contract)
- [x] `GenreExperience` mode-split shell (orchestrator) — sticky session chrome, Guided claim+Featured+Widen, Self dual-pane, atlas link leave-path, world-accent on steer — **integration seams DONE**
- [x] Hub one-fold (sibling) — map-as-atlas; **~3.3 → 1.23 vh**; Enter in fold; doors/mood disclosures
- [x] Timeline tray craft (Self sibling) — decade tray + All-eras summary; Horror Self **2.13 vh**; pageLenJump≈0 on All eras
- [x] Guided Companion DEEPEN HUD
- [x] Tray content-visibility nugget
- [x] Cold bootstrap (Self `activeDecade` / `pickPreferredDecade` — not All eras on cold load)
- [x] Guided cockpit packing closed (Claim desk + Widen; live Horror 1.43 / Doc 1.48)
- [x] Widen UX unified + Q6-A verified live (desk CTA → chip + tray; no page `<details>`)
- [x] Live scoreboard GREEN (Hub 1.23 · Horror Self 2.13 · Horror Guided Claim 1.43 · Doc Guided 1.48)
- [x] Wave packing (Mode-split B) COMPLETE
- [x] Whisper / era contract wiring (orchestrator seam) — `guidedStage` + `eraBand` + `isSeedWorld` + success `tourCue`
- [ ] A11y P1 backlog (**optional**)
- [ ] Wave 6 taste polish (**optional**)
